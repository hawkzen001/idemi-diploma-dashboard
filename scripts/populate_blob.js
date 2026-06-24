import fs from 'fs';
import https from 'https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { put, list, del } from '@vercel/blob';
import Papa from 'papaparse';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1TRkzM1g8SBxy-DfcimxJ-l2UNHTHwgUOym1s7NglxCE/export?format=csv';

const fetchCSV = () => {
  return new Promise((resolve, reject) => {
    https.get(GOOGLE_SHEET_CSV_URL, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
          let data = '';
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => resolve(data));
        }).on('error', reject);
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }
    }).on('error', reject);
  });
};

const extractSSCPercentage = async (driveUrl) => {
  let id = driveUrl;
  if (driveUrl.includes('id=')) {
    id = driveUrl.split('id=')[1].split('&')[0];
  } else if (driveUrl.includes('/d/')) {
    id = driveUrl.split('/d/')[1].split('/')[0];
  }

  if (!id) return 'Error';

  try {
    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    
    const fetchDriveImage = (urlStr) => {
      return new Promise((resolve, reject) => {
        const getReq = (currentUrl) => {
          https.get(currentUrl, (proxyRes) => {
            if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
              getReq(proxyRes.headers.location);
            } else {
              let data = [];
              proxyRes.on('data', chunk => data.push(chunk));
              proxyRes.on('end', () => {
                const buffer = Buffer.concat(data);
                resolve({ buffer, mimeType: proxyRes.headers['content-type'] });
              });
              proxyRes.on('error', reject);
            }
          }).on('error', reject);
        };
        getReq(urlStr);
      });
    };

    const { buffer, mimeType } = await fetchDriveImage(url);

    let finalMimeType = mimeType;
    if (!finalMimeType || finalMimeType.includes('octet-stream')) {
      const b64Prefix = buffer.toString('base64', 0, 20);
      if (b64Prefix.startsWith('/9j/')) finalMimeType = 'image/jpeg';
      else if (b64Prefix.startsWith('iVBORw')) finalMimeType = 'image/png';
      else if (b64Prefix.startsWith('JVBERi0')) finalMimeType = 'application/pdf';
      else finalMimeType = 'image/jpeg';
    }

    const base64Data = buffer.toString('base64');
    const modelName = "gemini-2.5-flash-lite"; // Fast, good enough for extraction

    const prompt = `Analyze this image to find the final total SSC/10th percentage. 
WARNING: Check if this is actually a marksheet/result. If it is a Caste Certificate, Leaving Certificate, photo, or irrelevant document, you MUST return EXACTLY 'N/A'.
If it is a marksheet, find the final total percentage or CGPA. 
If CGPA is given, convert it to percentage if standard (e.g. CGPA * 9.5).
If only marks are given, calculate (Obtained/Total)*100.
Return ONLY the final percentage number as a float (e.g. 85.50). Do not include the '%' sign. 
If you absolutely cannot find or calculate it, return 'N/A'. Do not include any other text.`;

    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: finalMimeType } }
    ]);

    let text = result.response.text().trim();
    if (text.startsWith('```')) {
      text = text.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();
    }
    return text;
  } catch (error) {
    console.error("Extraction error for ID", id, ":", error.message);
    return 'Error';
  }
};

const run = async () => {
  console.log("Fetching CSV data...");
  const csvData = await fetchCSV();
  
  console.log("Parsing CSV data...");
  const results = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  
  let data = results.data
    .filter(row => row['Timestamp'])
    .map(row => ({
      id: row['Timestamp'] + row['Email Address'],
      timestamp: row['Timestamp'],
      name: row['Full Name (in Capital letters)'] ? row['Full Name (in Capital letters)'].toUpperCase() : '',
      course: row['Applying for :'],
      sscResultUrl: row['SSC Result (kindly upload SSC marksheet - Even online is accepted)']
    }));
  
  const aryan = data.find(d => d.name && d.name.toUpperCase().includes('ARYAN JITENDRA PATHANE'));
  if (aryan && aryan.timestamp) {
    const cutoffDate = new Date(aryan.timestamp);
    data = data.filter(d => d.timestamp && new Date(d.timestamp) >= cutoffDate);
  }

  data = data.filter(d => 
    d.course && (
      d.course.toLowerCase().includes('3d animation') ||
      d.course.toLowerCase().includes('mechatronics') ||
      d.course.toLowerCase().includes('tool & die')
    )
  );

  console.log(`Found ${data.length} valid applications.`);

  // Fetch current Blob state
  console.log("Fetching current Blob state...");
  const { blobs } = await list({ prefix: 'ssc-data', token: process.env.BLOB_READ_WRITE_TOKEN });
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  
  let currentData = {};
  if (blobs.length > 0) {
    const res = await fetch(blobs[0].url);
    currentData = await res.json();
  }

  console.log(`Blob currently has ${Object.keys(currentData).length} extracted percentages.`);

  let newExtractions = 0;

  for (const row of data) {
    if (row.sscResultUrl && !currentData[row.id] && currentData[row.id] !== 'Error') {
      console.log(`Extracting SSC % for ${row.name}...`);
      const percentage = await extractSSCPercentage(row.sscResultUrl);
      console.log(`-> Extracted: ${percentage}`);
      
      currentData[row.id] = percentage;
      newExtractions++;
      
      // Delay to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 4500));
    }
  }

  if (newExtractions > 0) {
    console.log(`Saving ${newExtractions} new extractions to Vercel Blob...`);
    await put('ssc-data.json', JSON.stringify(currentData), { 
      access: 'public',
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    if (blobs.length > 0) {
      const urlsToDelete = blobs.map(b => b.url);
      await del(urlsToDelete, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }
    console.log("Save complete!");
  } else {
    console.log("No new extractions to save.");
  }
};

run().catch(console.error);

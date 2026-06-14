import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import https from 'https';

const envFile = fs.readFileSync('.env', 'utf8');
const match = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
const key = match ? match[1].trim() : '';

const genAI = new GoogleGenerativeAI(key);

const fetchImage = (id) => {
  return new Promise((resolve, reject) => {
    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    const getReq = (urlStr) => {
      https.get(urlStr, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          getReq(res.headers.location);
        } else {
          let data = [];
          res.on('data', chunk => data.push(chunk));
          res.on('end', () => {
             const buffer = Buffer.concat(data);
             resolve({ buffer, mimeType: res.headers['content-type'] });
          });
          res.on('error', reject);
        }
      }).on('error', reject);
    };
    getReq(url);
  });
};

async function run() {
  try {
    const { buffer, mimeType } = await fetchImage('1a0TCXy4K8Fifg1gIf0CIW3DqsSonSPtm');
    let finalMime = mimeType;
    if (!finalMime || finalMime === 'application/octet-stream') {
        const b64 = buffer.toString('base64');
        if (b64.startsWith('/9j/')) finalMime = 'image/jpeg';
        else if (b64.startsWith('iVBORw')) finalMime = 'image/png';
        else if (b64.startsWith('JVBERi0')) finalMime = 'application/pdf';
        else finalMime = 'image/jpeg';
    }
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
    
    const prompt = `Analyze this Indian SSC/10th marksheet.
Goal: Return ONLY the final overall percentage as a number (e.g. 85.50).
1. Look for an explicitly stated percentage or CGPA.
2. If not found, look for "Total Marks Obtained" and "Max Marks", and calculate it: (Obtained / Max) * 100.
3. If CGPA is given, convert it to percentage if standard (e.g. CGPA * 9.5).
Return ONLY the number. Do not write anything else. If impossible, return N/A.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: buffer.toString('base64'), mimeType: finalMime } }
    ]);
    console.log("Calc Prompt Result:", result.response.text());

  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();

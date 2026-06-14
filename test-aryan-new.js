import fs from 'fs';
import https from 'https';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const prompt = `Analyze this image to find the final total SSC/10th percentage. 
WARNING: Check if this is actually a marksheet/result. If it is a Caste Certificate, Leaving Certificate, photo, or irrelevant document, you MUST return EXACTLY 'N/A'.
If it is a marksheet, find the final total percentage or CGPA. 
If CGPA is given, convert it to percentage if standard (e.g. CGPA * 9.5).
If only marks are given, calculate (Obtained/Total)*100.
Return ONLY the final percentage number as a float (e.g. 85.50). Do not include the '%' sign. 
If you absolutely cannot find or calculate it, return 'N/A'. Do not include any other text.`;
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: buffer.toString('base64'), mimeType: finalMime } }
    ]);
    console.log("Aryan extraction result:", result.response.text());

  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();

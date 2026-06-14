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
    const { buffer, mimeType } = await fetchImage('1lvnaUyL6Qy9SQF7mgSBPs4PkXadwQ1SW');
    console.log("MimeType from Drive:", mimeType, "Size:", buffer.length);
    let finalMime = mimeType;
    if (!finalMime || finalMime === 'application/octet-stream') {
        const b64 = buffer.toString('base64');
        if (b64.startsWith('/9j/')) finalMime = 'image/jpeg';
        else if (b64.startsWith('iVBORw')) finalMime = 'image/png';
        else if (b64.startsWith('JVBERi0')) finalMime = 'application/pdf';
        else finalMime = 'image/jpeg';
    }
    console.log("Using MimeType:", finalMime);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent([
      "Analyze this SSC marksheet/result. Find the final total percentage.",
      { inlineData: { data: buffer.toString('base64'), mimeType: finalMime } }
    ]);
    console.log("Result:", result.response.text());
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();

import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const id = '1VOj53Uc80PLAlt5aVjzyLnW_DmVIj8K-'; // sample public ID
const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${apiKey}`;

https.get(url, (res) => {
  console.log("Status:", res.statusCode);
  let data = [];
  res.on('data', chunk => data.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    console.log("Buffer Length:", buffer.length);
    console.log("Response:", buffer.toString('utf8', 0, 200));
  });
}).on('error', console.error);

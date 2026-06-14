import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import https from 'https';

const envFile = fs.readFileSync('.env', 'utf8');
const match = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
const key = match ? match[1].trim() : '';

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const models = JSON.parse(data).models;
    console.log("Models:", models ? models.map(m => m.name).join(', ') : data);
  });
});

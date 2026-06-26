import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-pro-latest"
  ];
  let lastError;
  for (const m of modelsToTry) {
    try {
      console.log("Trying model:", m);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("hello");
      console.log("Success with", m);
      break;
    } catch(e) {
      console.log("Failed with", m, "Status:", e.status);
    }
  }
}
test();

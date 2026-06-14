import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const match = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
const key = match ? match[1].trim() : '';

const genAI = new GoogleGenerativeAI(key);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Test");
    console.log(`${modelName}: SUCCESS`);
  } catch (e) {
    console.log(`${modelName}: FAIL - ${e.message.substring(0, 100)}`);
  }
}

async function run() {
  await testModel('gemini-2.0-flash-lite');
  await testModel('gemini-flash-lite-latest');
  await testModel('gemini-2.5-flash-lite');
  await testModel('gemini-2.0-flash');
}
run();

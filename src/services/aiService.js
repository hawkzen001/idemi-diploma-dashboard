import { GoogleGenerativeAI } from '@google/generative-ai';

const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in environment variables.");
  }
  return new GoogleGenerativeAI(apiKey);
};

const executeExtraction = async (base64Data, mimeType) => {
  const genAI = getGeminiClient();
  
  // Ensure valid mimeType for Gemini
  let finalMimeType = mimeType;
  if (!finalMimeType || finalMimeType.includes('octet-stream') || finalMimeType === 'text/html') {
    const b64Prefix = base64Data.substring(0, 20);
    if (b64Prefix.startsWith('/9j/')) finalMimeType = 'image/jpeg';
    else if (b64Prefix.startsWith('iVBORw')) finalMimeType = 'image/png';
    else if (b64Prefix.startsWith('JVBERi0')) finalMimeType = 'application/pdf';
    else finalMimeType = 'image/jpeg'; // Fallback
  }

  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro-latest"
  ];

  const prompt = `Analyze this image to find the final total SSC/10th percentage. 
WARNING: Check if this is actually a marksheet/result. If it is a Caste Certificate, Leaving Certificate, photo, or irrelevant document, you MUST return EXACTLY 'N/A'.
If it is a marksheet, find the final total percentage or CGPA. 
If CGPA is given, convert it to percentage if standard (e.g. CGPA * 9.5).
If only marks are given, calculate (Obtained/Total)*100.
Return ONLY the final percentage number as a float (e.g. 85.50). Do not include the '%' sign. 
If you absolutely cannot find or calculate it, return 'N/A'. Do not include any other text.`;

  let result = null;
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: finalMimeType } }
      ]);
      break; // Success
    } catch (e) {
      console.error(`Model ${modelName} failed:`, e.message);
      lastError = e;
      continue; // Try next model on any error
    }
  }

  if (!result) {
    throw lastError || new Error("All models failed due to quota exhaustion.");
  }
  
  let text = result.response.text().trim();
  if (text.startsWith('```')) {
    text = text.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();
  }

  return text;
};

export const extractSSCPercentage = async (driveUrl) => {
  try {
    // 1. Extract the file ID
    let id = driveUrl;
    if (driveUrl.includes('id=')) {
      id = driveUrl.split('id=')[1].split('&')[0];
    } else if (driveUrl.includes('/d/')) {
      id = driveUrl.split('/d/')[1].split('/')[0];
    }

    if (!id) {
      throw new Error("Invalid Google Drive URL");
    }

    // 2. Fetch the image from Google Drive using the Google Apps Script Proxy directly from client
    const proxyUrl = `https://script.google.com/macros/s/AKfycbxnfkaYqQREEvhxtIEIxCVZ26todhTqMgQGwT_tYHPtNm8PXwaSkBfblAt9akZtcsPG/exec?id=${id}`;
    
    const proxyResponse = await fetch(proxyUrl);
    if (!proxyResponse.ok) {
      throw new Error(`Proxy returned status ${proxyResponse.status}`);
    }
    
    const data = await proxyResponse.json();
    
    if (data.error) {
      throw new Error(`Google Apps Script Error: ${data.error}`);
    }

    if (!data.base64) {
      throw new Error("Proxy failed to return image data. Please ensure the proxy is configured correctly.");
    }

    // 3. Execute extraction with Gemini
    return await executeExtraction(data.base64, data.mimeType);

  } catch (error) {
    console.error("AI Extraction Error:", error);
    throw error;
  }
};

export const extractLocalMarksheet = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(',')[1];
        const mimeType = file.type;
        
        const percentage = await executeExtraction(base64Data, mimeType);
        resolve(percentage);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = error => reject(error);
  });
};

import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { base64Data, mimeType } = req.body;

  if (!base64Data || !mimeType) {
    return res.status(400).json({ error: 'Missing base64Data or mimeType' });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is missing on the server' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro-latest"
    ];

    const prompt = `Analyze this image to find the final total SSC/10th percentage. 
WARNING: Check if the marks are "Best of 5". If so, the percentage should be calculated based on the 5 subjects with the highest marks. 
If it is not Best of 5, use the grand total percentage.
IMPORTANT: Return ONLY the raw number (e.g., 85.00). Do not include any text, symbols, percentage signs, or explanations. Just the number.`;

    let percentage = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ]);
        
        let responseText = result.response.text();
        const match = responseText.match(/(\d{2,3}(?:\.\d{1,2})?)/);
        
        if (match && match[1]) {
          percentage = match[1];
          break; // Success, break out of loop
        }
      } catch (err) {
        lastError = err;
        // Continue to the next model
      }
    }

    if (percentage) {
      return res.status(200).json({ percentage });
    } else {
      throw new Error(lastError ? lastError.message : "Failed to extract percentage from all models.");
    }

  } catch (error) {
    console.error("Extraction error:", error);
    return res.status(500).json({ error: error.message });
  }
}

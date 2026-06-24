import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all blobs
    const { blobs } = await list({ prefix: 'considered-data' });
    
    if (blobs.length > 0) {
      // Sort by uploadedAt (newest first)
      blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      
      const blobResponse = await fetch(blobs[0].url, { cache: 'no-store' });
      const data = await blobResponse.json();
      return res.status(200).json(data);
    }
    
    // If no file exists yet, return an empty object
    return res.status(200).json({});
  } catch (error) {
    console.error("Error fetching consideredFor data from Blob:", error);
    return res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
}

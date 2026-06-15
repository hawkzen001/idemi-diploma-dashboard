import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, percentage } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    // 1. Fetch current data
    const { blobs } = await list({ prefix: 'ssc-data.json' });
    let currentData = {};
    
    if (blobs.length > 0) {
      const url = new URL(blobs[0].url);
      url.searchParams.append('t', Date.now());
      const blobResponse = await fetch(url.toString(), { cache: 'no-store' });
      currentData = await blobResponse.json();
    }

    // 2. Update with new percentage
    currentData[id] = percentage;

    // 3. Save back to Blob store (overwrite)
    await put('ssc-data.json', JSON.stringify(currentData), { 
      access: 'public',
      addRandomSuffix: false // Overwrites the existing file
    });

    return res.status(200).json({ success: true, saved: { [id]: percentage } });
  } catch (error) {
    console.error("Error saving SSC data to Blob:", error);
    return res.status(500).json({ error: "Failed to save data", details: error.message });
  }
}

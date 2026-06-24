import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, eligibility } = req.body;
    if (!id || !eligibility) {
      return res.status(400).json({ error: 'ID and eligibility are required' });
    }

    // 1. Fetch current data
    const { blobs } = await list({ prefix: 'eligibility-data' });
    
    // Sort by uploadedAt (newest first)
    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    let currentData = {};
    if (blobs.length > 0) {
      const blobResponse = await fetch(blobs[0].url, { cache: 'no-store' });
      currentData = await blobResponse.json();
    }

    // 2. Update with new categorization
    if (eligibility === 'Auto') {
      delete currentData[id];
    } else {
      currentData[id] = eligibility;
    }

    // 3. Save to Blob store with a random suffix to completely bypass Vercel Cache
    await put('eligibility-data.json', JSON.stringify(currentData), { 
      access: 'public',
      addRandomSuffix: true
    });

    // 4. Delete all old blobs to prevent storage buildup
    if (blobs.length > 0) {
      const urlsToDelete = blobs.map(b => b.url);
      await del(urlsToDelete);
    }

    return res.status(200).json({ success: true, saved: { [id]: eligibility } });
  } catch (error) {
    console.error("Error saving eligibility data to Blob:", error);
    return res.status(500).json({ error: "Failed to save data", details: error.message });
  }
}

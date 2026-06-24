import fs from 'fs';
import { put, list, del } from '@vercel/blob';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const run = async () => {
  const { blobs } = await list({ prefix: 'ssc-data', token: process.env.BLOB_READ_WRITE_TOKEN });
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  
  if (blobs.length > 0) {
    const res = await fetch(blobs[0].url);
    const data = await res.json();
    
    let cleanedCount = 0;
    for (const key in data) {
      if (data[key] === 'Error') {
        delete data[key];
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} Error entries. Saving...`);
      await put('ssc-data.json', JSON.stringify(data), { 
        access: 'public',
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      const urlsToDelete = blobs.map(b => b.url);
      await del(urlsToDelete, { token: process.env.BLOB_READ_WRITE_TOKEN });
      console.log("Cleanup complete!");
    } else {
      console.log("No Error entries found.");
    }
  }
};
run().catch(console.error);

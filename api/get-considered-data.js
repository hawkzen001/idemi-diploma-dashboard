import { db } from '../lib/firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!db) return res.status(500).json({ error: 'Firebase not configured' });

    const docRef = db.collection('overrides').doc('considered');
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return res.status(200).json(docSnap.data());
    } else {
      return res.status(200).json({});
    }
  } catch (error) {
    console.error("Error fetching considered data from Firestore:", error);
    return res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
}

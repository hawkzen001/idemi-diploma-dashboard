import { db } from '../lib/firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, result } = req.body;
    if (!id || result === undefined) {
      return res.status(400).json({ error: 'ID and result are required' });
    }

    if (!db) return res.status(500).json({ error: 'Firebase not configured' });

    const docRef = db.collection('overrides').doc('ssc');

    // Merge the new field
    await docRef.set({
      [id]: result
    }, { merge: true });

    return res.status(200).json({ success: true, saved: { [id]: result } });
  } catch (error) {
    console.error("Error saving SSC data to Firestore:", error);
    return res.status(500).json({ error: "Failed to save data", details: error.message });
  }
}

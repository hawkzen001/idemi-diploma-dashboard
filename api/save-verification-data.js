import { db } from './firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, verification } = req.body;
    if (!id || !verification) {
      return res.status(400).json({ error: 'ID and verification status are required' });
    }

    if (!db) return res.status(500).json({ error: 'Firebase not configured' });

    const docRef = db.collection('overrides').doc('verification');

    // Merge the new field
    await docRef.set({
      [id]: verification
    }, { merge: true });

    return res.status(200).json({ success: true, saved: { [id]: verification } });
  } catch (error) {
    console.error("Error saving verification data to Firestore:", error);
    return res.status(500).json({ error: "Failed to save data", details: error.message });
  }
}

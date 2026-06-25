import { db } from '../lib/firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, considered } = req.body;
    if (!id || !considered) {
      return res.status(400).json({ error: 'ID and considered state are required' });
    }

    if (!db) return res.status(500).json({ error: 'Firebase not configured' });

    const docRef = db.collection('overrides').doc('considered');

    if (considered === 'Auto') {
      const admin = await import('firebase-admin');
      await docRef.set({
        [id]: admin.default.firestore.FieldValue.delete()
      }, { merge: true });
    } else {
      // Merge the new field
      await docRef.set({
        [id]: considered
      }, { merge: true });
    }

    return res.status(200).json({ success: true, saved: { [id]: considered } });
  } catch (error) {
    console.error("Error saving considered data to Firestore:", error);
    return res.status(500).json({ error: "Failed to save data", details: error.message });
  }
}

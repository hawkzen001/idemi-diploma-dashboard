import { db } from './firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, category } = req.body;
    if (!id || !category) {
      return res.status(400).json({ error: 'ID and category are required' });
    }

    if (!db) return res.status(500).json({ error: 'Firebase not configured' });

    const docRef = db.collection('overrides').doc('category');

    if (category === 'Auto') {
      const admin = await import('firebase-admin');
      await docRef.set({
        [id]: admin.default.firestore.FieldValue.delete()
      }, { merge: true });
    } else {
      // Merge the new field
      await docRef.set({
        [id]: category
      }, { merge: true });
    }

    return res.status(200).json({ success: true, saved: { [id]: category } });
  } catch (error) {
    console.error("Error saving category data to Firestore:", error);
    return res.status(500).json({ error: "Failed to save data", details: error.message });
  }
}

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('./idemi-aicte-dashboard-firebase-adminsdk-fbsvc-1030af3275.json');
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

async function checkSscErrors() {
  const doc = await db.collection('overrides').doc('ssc').get();
  const data = doc.data() || {};
  
  const errors = Object.entries(data).filter(([id, val]) => val === 'Error');
  console.log(`Total 'Error' values found in Firestore: ${errors.length}`);
  
  // Find Arush
  const arush = Object.entries(data).filter(([id, val]) => id.toLowerCase().includes('arush'));
  console.log(`Arush data:`, arush);
  
  // If there are errors, let's fix them by deleting them
  if (errors.length > 0) {
    const updates = {};
    const FieldValue = require('firebase-admin/firestore').FieldValue;
    for (const [id, val] of errors) {
      updates[id] = FieldValue.delete();
    }
    await db.collection('overrides').doc('ssc').update(updates);
    console.log(`Successfully deleted ${errors.length} 'Error' values from Firestore.`);
  }
}

checkSscErrors().catch(console.error);

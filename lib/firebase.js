import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin Initialized');
    } else {
      console.warn('Firebase credentials missing in environment variables');
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const db = admin.apps.length ? admin.firestore() : null;

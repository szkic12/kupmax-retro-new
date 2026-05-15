import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Firebase Admin env vars missing: FIREBASE_PROJECT_ID=${!!projectId} FIREBASE_CLIENT_EMAIL=${!!clientEmail} FIREBASE_PRIVATE_KEY=${!!privateKey}`
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    storageBucket: 'vibe3d-ece08.firebasestorage.app',
  });
}

export const firestore = admin.firestore();
export const storageBucket = admin.storage().bucket();
export const FieldValue = admin.firestore.FieldValue;

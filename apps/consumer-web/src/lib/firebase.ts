import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

const firebaseConfigured =
  !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export { firebaseConfig };

const RTDB_APP_NAME = "consumer-rtdb";

function resolveApp(): FirebaseApp | null {
  if (!firebaseConfigured) return null;

  const wantsRtdb = !!firebaseConfig.databaseURL;

  if (wantsRtdb) {
    const existing = getApps().find(a => a.name === RTDB_APP_NAME);
    if (existing) return existing;
    return initializeApp(firebaseConfig, RTDB_APP_NAME);
  }

  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  try {
    return getApp();
  } catch {
    const all = getApps();
    if (all.length > 0) return all[0];
    return null;
  }
}

const app = resolveApp();

export default app;

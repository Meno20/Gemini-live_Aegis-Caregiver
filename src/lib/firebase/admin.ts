import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let _app: App | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // During build time, return a dummy app or skip
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠ Firebase Admin credentials not found. Skipping initialization.');
    // Return a placeholder that will be replaced at runtime
    _app = initializeApp({ projectId: 'placeholder' });
    return _app;
  }

  _app = initializeApp({
    credential: cert({
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    } as any),
  });

  return _app;
}

export function getAdminDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getAdminApp());
  return _db;
}

export function getAdminAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getAdminApp());
  return _auth;
}

// Lazy exports — use these functions instead of direct exports
export const adminDb = new Proxy({} as Firestore, {
  get(_, prop) {
    const db = getAdminDb();
    const value = (db as any)[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_, prop) {
    const auth = getAdminAuth();
    const value = (auth as any)[prop];
    return typeof value === 'function' ? value.bind(auth) : value;
  },
});

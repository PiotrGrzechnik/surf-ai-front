import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";

/**
 * Shape of the Firebase configuration pulled from environment variables.
 */
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

function assertConfig(config: FirebaseConfig) {
  if (!config.apiKey || !config.authDomain || !config.projectId) {
    throw new Error(
      "Firebase client configuration is incomplete. Please verify NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }
}

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? undefined,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? undefined,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? undefined,
};

assertConfig(firebaseConfig);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

function ensureClient(): void {
  if (typeof window === "undefined") {
    throw new Error("Firebase client is not available during server-side rendering.");
  }
}

function getFirebaseApp(): FirebaseApp {
  ensureClient();
  if (!app) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  ensureClient();
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

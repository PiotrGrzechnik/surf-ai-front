import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * Shape of the Firebase configuration pulled from environment variables.
 */
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
};

/**
 * Initializes the Firebase app only once across client and server renders.
 */
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

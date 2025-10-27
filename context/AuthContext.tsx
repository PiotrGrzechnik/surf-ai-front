import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getFirebaseAuth } from "../lib/firebase";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  allowed: boolean;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function useAllowedGmails(): string[] {
  return useMemo(() => {
    const raw = process.env.ALLOWED_GMAILS ?? "";
    return raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }, []);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const allowedGmails = useAllowedGmails();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    const firebaseAuth = getFirebaseAuth();
    await signInWithPopup(firebaseAuth, provider);
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    const firebaseAuth = getFirebaseAuth();
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    const firebaseAuth = getFirebaseAuth();
    await createUserWithEmailAndPassword(firebaseAuth, email, password);
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    const firebaseAuth = getFirebaseAuth();
    await signOut(firebaseAuth);
  }, []);

  const resetError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const firebaseAuth = getFirebaseAuth();
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setToken(null);
        setAllowed(false);
        setLoading(false);
        return;
      }

      const email = firebaseUser.email?.toLowerCase();
      const emailAllowed = email ? allowedGmails.includes(email) : false;

      if (!emailAllowed) {
        await signOut(firebaseAuth);
        setError("Your Gmail address is not whitelisted for this application.");
        setUser(null);
        setToken(null);
        setAllowed(false);
        setLoading(false);
        return;
      }

      const idToken = await firebaseUser.getIdToken();

      setUser(firebaseUser);
      setToken(idToken);
      setAllowed(true);
      setLoading(false);
    });
  }, [allowedGmails]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const firebaseAuth = getFirebaseAuth();
    return onIdTokenChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        setToken(null);
        return;
      }
      const email = firebaseUser.email?.toLowerCase();
      if (!email || !allowedGmails.includes(email)) {
        setToken(null);
        return;
      }
      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);
    });
  }, [allowedGmails]);

  const value: AuthContextValue = {
    user,
    token,
    allowed,
    loading,
    error,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    resetError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

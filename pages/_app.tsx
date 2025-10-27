import type { AppProps } from "next/app";
import { AuthProvider } from "../context/AuthContext";
import "../styles/globals.css";

/**
 * Wraps every page with global providers and Tailwind styles.
 */
export default function SurfAiApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

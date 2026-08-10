import { createContext, useCallback, useContext, useState } from "react";

interface GoogleAuthValue {
  idToken: string | null;
  email: string | null;
  setAuth: (idToken: string) => void;
  clearAuth: () => void;
}

const GoogleAuthContext = createContext<GoogleAuthValue | null>(null);

function decodeEmail(jwt: string): string | null {
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [idToken, setIdToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const setAuth = useCallback((token: string) => {
    setIdToken(token);
    setEmail(decodeEmail(token));
  }, []);

  const clearAuth = useCallback(() => {
    setIdToken(null);
    setEmail(null);
  }, []);

  return (
    <GoogleAuthContext.Provider value={{ idToken, email, setAuth, clearAuth }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx) throw new Error("useGoogleAuth must be used inside GoogleAuthProvider");
  return ctx;
}

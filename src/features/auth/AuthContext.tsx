import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken } from '@/lib/api';
import type { PerfilResponse } from '@/lib/types';
import { useLoginGoogle } from '@/features/auth/hooks/useAuth';

interface AuthContextValue {
  token: string | null;
  perfil: PerfilResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<PerfilResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const loginMutation = useLoginGoogle();

  const fetchPerfil = useCallback(async (jwt: string) => {
    setAuthToken(jwt);
    const { data } = await api.get<PerfilResponse>('/api/v1/auth/me');
    return data;
  }, []);

  const login = useCallback(
    async (idToken: string) => {
      setIsLoading(true);
      try {
        const auth = await loginMutation.mutateAsync(idToken);
        setAuthToken(auth.token);
        setToken(auth.token);
        const profile = await fetchPerfil(auth.token);
        setPerfil(profile);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPerfil, loginMutation]
  );

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setPerfil(null);
    navigate('/', { replace: true });
  }, [navigate]);

  // Keep in-memory token in sync with the api module on mount/teardown is a no-op:
  // token lives only in this context instance for the active tab.
  useEffect(() => {
    return () => setAuthToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      perfil,
      isAuthenticated: token !== null,
      isLoading,
      login,
      logout,
    }),
    [token, perfil, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

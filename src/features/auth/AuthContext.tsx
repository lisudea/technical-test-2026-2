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
import type { PerfilResponse, Rol } from '@/lib/types';
import { ROLES } from '@/lib/types';
import { useLoginGoogle } from '@/features/auth/hooks/useAuth';

/**
 * Session state for the whole app.
 *
 * The role exposed here drives which consoles are rendered, and nothing
 * more. It is a display hint: every privileged endpoint re-checks the role
 * server-side, so a user who edits their profile in devtools sees extra menu
 * items and gets a 403 the moment they click one.
 */
interface AuthContextValue {
  token: string | null;
  perfil: PerfilResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** The signed-in user's role, or null when nobody is signed in. */
  rol: Rol | null;
  /** True when the user holds `required` or a more privileged role. */
  hasRole: (required: Rol) => boolean;
  /** Loan-desk staff: AUXILIAR or ADMIN. */
  isStaff: boolean;
  isAdmin: boolean;
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

  const value = useMemo<AuthContextValue>(() => {
    const rol = perfil?.rol ?? null;

    // Compare by position in ROLES, so "at least AUXILIAR" is one rule
    // instead of an ever-growing list of equality checks that someone
    // forgets to extend when a role is added.
    const hasRole = (required: Rol) =>
      rol !== null && ROLES.indexOf(rol) >= ROLES.indexOf(required);

    return {
      token,
      perfil,
      isAuthenticated: token !== null,
      isLoading,
      rol,
      hasRole,
      isStaff: hasRole('AUXILIAR'),
      isAdmin: hasRole('ADMIN'),
      login,
      logout,
    };
  }, [token, perfil, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

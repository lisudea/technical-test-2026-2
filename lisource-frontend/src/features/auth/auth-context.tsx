import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import i18n, { isAppLanguage, persistLanguage, type AppLanguage } from "@/i18n";
import { completeLogout } from "@/features/auth/logout-flow";
import { authService, dataMode } from "@/services";
import { getAccessToken, onAuthenticationLost, setAccessToken } from "@/services/http-client";
import { connectRealtime, disconnectRealtime } from "@/services/realtime.service";
import { users } from "@/services/mocks/data";
import type { UserDto } from "@/types";

interface AuthContextValue {
  user: UserDto | null;
  ready: boolean;
  roleSelection: { availableRoles: string[] } | null;
  login: (email: string, password: string) => Promise<UserDto | null>;
  loginGoogle: (credential: string) => Promise<UserDto | null>;
  selectRole: (role: string) => Promise<UserDto>;
  switchRole: (role: string) => Promise<UserDto>;
  cancelRoleSelection: () => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateLanguage: (language: AppLanguage) => Promise<void>;
  updateProfile: (input: { firstName: string; lastName: string }) => Promise<UserDto>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const MOCK_SESSION_KEY = "lisource.mock.session.email";

export function AuthProvider({
  children,
  onLoggedOut,
}: {
  children: ReactNode;
  onLoggedOut: () => Promise<void> | void;
}) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [ready, setReady] = useState(false);
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const latestLanguageRequest = useRef<AppLanguage | null>(null);
  const queryClient = useQueryClient();

  const applyUser = useCallback((next: UserDto | null) => {
    setUser(next);
    if (next) {
      const language = isAppLanguage(next.preferredLanguage) ? next.preferredLanguage : "es";
      persistLanguage(language);
      void i18n.changeLanguage(language);
      if (dataMode === "mock") window.sessionStorage.setItem(MOCK_SESSION_KEY, next.email);
    } else if (dataMode === "mock") {
      window.sessionStorage.removeItem(MOCK_SESSION_KEY);
    }
  }, []);

  const leaveAuthenticatedArea = useCallback(
    (revokeServerSession: () => Promise<unknown>) =>
      completeLogout({
        revokeServerSession,
        clearAccessToken: () => setAccessToken(null),
        clearAuthenticationState: () => {
          setSelectionToken(null);
          setAvailableRoles([]);
          applyUser(null);
        },
        clearAuthenticatedCache: () => queryClient.clear(),
        disconnectRealtime,
        redirectToLogin: onLoggedOut,
      }),
    [applyUser, onLoggedOut, queryClient],
  );

  useEffect(() => {
    let active = true;
    onAuthenticationLost(() => {
      if (active) void leaveAuthenticatedArea(async () => undefined);
    });
    const bootstrap = async () => {
      if (dataMode === "mock") {
        const email = window.sessionStorage.getItem(MOCK_SESSION_KEY);
        const found = users.find((candidate) => candidate.email === email);
        if (found && active) {
          const { password: _password, ...dto } = found;
          applyUser(dto);
        }
      } else {
        try {
          const restored = await authService.refresh();
          if (active) applyUser(restored);
        } catch {
          setAccessToken(null);
        }
      }
      if (active) setReady(true);
    };
    void bootstrap();
    return () => {
      active = false;
      onAuthenticationLost(null);
    };
  }, [applyUser, leaveAuthenticatedArea]);

  useEffect(() => {
    if (!user || dataMode !== "api") return;
    return connectRealtime(getAccessToken, (event) => {
      if (event.equipmentId !== undefined) {
        void queryClient.invalidateQueries({ queryKey: ["equipment"] });
      }
      if (event.reservationId !== undefined) {
        void queryClient.invalidateQueries({ queryKey: ["reservations"] });
        void queryClient.invalidateQueries({ queryKey: ["equipment"] });
      }
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    });
  }, [user, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      login: async (email, password) => {
        const result = await authService.login(email, password);
        if (result.roleSelectionRequired && result.selectionToken) {
          setSelectionToken(result.selectionToken);
          setAvailableRoles(result.availableRoles);
          return null;
        }
        applyUser(result.user);
        return result.user;
      },
      loginGoogle: async (credential) => {
        const result = await authService.loginGoogle(credential);
        if (result.roleSelectionRequired && result.selectionToken) {
          setSelectionToken(result.selectionToken);
          setAvailableRoles(result.availableRoles);
          return null;
        }
        applyUser(result.user);
        return result.user;
      },
      roleSelection: selectionToken ? { availableRoles } : null,
      selectRole: async (role) => {
        if (!selectionToken) throw new Error("No role selection is pending");
        const next = await authService.selectRole(selectionToken, role);
        setSelectionToken(null);
        setAvailableRoles([]);
        applyUser(next);
        return next;
      },
      switchRole: async (role) => {
        const next = await authService.switchRole(role);
        applyUser(next);
        await queryClient.invalidateQueries();
        return next;
      },
      cancelRoleSelection: () => {
        setSelectionToken(null);
        setAvailableRoles([]);
      },
      logout: async () => {
        await leaveAuthenticatedArea(() => authService.logout());
      },
      logoutAll: async () => {
        await leaveAuthenticatedArea(() => authService.logoutAll());
      },
      updateLanguage: async (language) => {
        const previousUser = user;
        latestLanguageRequest.current = language;
        persistLanguage(language);
        void i18n.changeLanguage(language);
        if (!user) return;
        try {
          const updated = await authService.updateLanguage(language);
          if (latestLanguageRequest.current === language) applyUser(updated);
        } catch (error) {
          if (latestLanguageRequest.current === language) {
            applyUser(previousUser);
          }
          throw error;
        }
      },
      updateProfile: async (input) => {
        const updated = await authService.updateProfile(input);
        applyUser(updated);
        queryClient.setQueryData(["profile"], updated);
        return updated;
      },
    }),
    [user, ready, selectionToken, availableRoles, applyUser, leaveAuthenticatedArea, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

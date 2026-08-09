import { apiRequest, refreshSession, setAccessToken } from "@/services/http-client";
import { users } from "@/services/mocks/data";
import { delay } from "@/services/mocks/latency";
import type { AuthenticationResult, AuthResponse, SessionDto, UserDto } from "@/types";
import type { AppLanguage } from "@/i18n/languages";

export interface AuthService {
  login(email: string, password: string): Promise<AuthenticationResult>;
  loginGoogle(credential: string): Promise<AuthenticationResult>;
  selectRole(selectionToken: string, role: string): Promise<UserDto>;
  switchRole(role: string): Promise<UserDto>;
  refresh(): Promise<UserDto>;
  logout(): Promise<void>;
  logoutAll(): Promise<void>;
  requestPasswordRecovery(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  updateLanguage(languageCode: AppLanguage): Promise<UserDto>;
  updateProfile(input: { firstName: string; lastName: string }): Promise<UserDto>;
  activeSessions(): Promise<SessionDto[]>;
  revokeSession(sessionId: number): Promise<void>;
  logoutOthers(): Promise<number>;
}

const toDto = ({ password: _password, ...user }: (typeof users)[number]): UserDto => user;

export const MockAuthService: AuthService = {
  async login(email, password) {
    const found = users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
    if (!found || found.password !== password) throw new ApiError(401);
    const user = toDto(found);
    return delay(
      { user, roleSelectionRequired: false, availableRoles: user.roles, selectionToken: null },
      600,
    );
  },

  async loginGoogle() {
    throw new Error("Google sign-in is not available in mock mode");
  },

  async selectRole() {
    throw new Error("Role selection is not available in mock mode");
  },

  async switchRole(role) {
    const current = toDto(users[0]!);
    return { ...current, role: role === "ADMINISTRADOR" ? "ADMIN" : "USER" };
  },

  async refresh() {
    throw new Error("Mock sessions do not use refresh cookies");
  },

  async logout() {},

  async logoutAll() {},

  async requestPasswordRecovery(_email: string) {
    await delay(null, 700);
  },

  async resetPassword(_token, _newPassword) {
    await delay(null, 400);
  },

  async updateLanguage(languageCode) {
    const current = toDto(users[0]!);
    return { ...current, preferredLanguage: languageCode, languageCode };
  },
  async updateProfile(input) {
    const current = toDto(users[0]!);
    return { ...current, ...input };
  },
  async activeSessions() {
    return [];
  },
  async revokeSession() {},
  async logoutOthers() {
    return 0;
  },
};

async function authenticationRequest(path: string, body: object): Promise<AuthenticationResult> {
  const response = await apiRequest<AuthResponse>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (response.accessToken) setAccessToken(response.accessToken);
  return {
    user: response.user,
    roleSelectionRequired: response.roleSelectionRequired,
    availableRoles: response.availableRoles,
    selectionToken: response.selectionToken,
  };
}

async function authenticatedRequest(path: string, body: object): Promise<UserDto> {
  const result = await authenticationRequest(path, body);
  if (!result.user) throw new Error("Authentication response did not contain a user");
  return result.user;
}

export const ApiAuthService: AuthService = {
  login: (email, password) => authenticationRequest("/auth/login", { email, password }),
  loginGoogle: (credential) => authenticationRequest("/auth/google", { credential }),
  selectRole: (selectionToken, role) =>
    authenticatedRequest("/auth/select-role", { selectionToken, role }),
  switchRole: (role) => authenticatedRequest("/auth/switch-role", { role }),
  async refresh() {
    const user = (await refreshSession()).user;
    if (!user) throw new Error("Refresh response did not contain a user");
    return user;
  },
  async logout() {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
    }
  },
  async logoutAll() {
    try {
      await apiRequest<void>("/auth/logout-all", { method: "POST" });
    } finally {
      setAccessToken(null);
    }
  },
  async requestPasswordRecovery(email) {
    await apiRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
  },
  async resetPassword(token, newPassword) {
    await apiRequest<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },
  async updateLanguage(languageCode) {
    return apiRequest<UserDto>("/profile", {
      method: "PATCH",
      body: JSON.stringify({ languageCode }),
    });
  },
  async updateProfile(input) {
    return apiRequest<UserDto>("/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  activeSessions: () => apiRequest<SessionDto[]>("/sessions"),
  async revokeSession(sessionId) {
    await apiRequest<void>(`/sessions/${sessionId}`, { method: "DELETE" });
  },
  async logoutOthers() {
    const result = await apiRequest<{ revokedSessions: number }>("/sessions/logout-others", {
      method: "POST",
    });
    return result.revokedSessions;
  },
};

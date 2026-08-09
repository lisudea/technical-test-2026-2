import { ApiError } from "@/lib/api-error";
import type { AuthResponse, ProblemDetails } from "@/types";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8080/api/v1";

let accessToken: string | null = null;
let refreshPromise: Promise<AuthResponse> | null = null;
let authenticationLost: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function onAuthenticationLost(callback: (() => void) | null) {
  authenticationLost = callback;
}

export async function refreshSession(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = rawRequest<AuthResponse>("/auth/refresh", { method: "POST" }, false)
      .then((response) => {
        setAccessToken(response.accessToken);
        return response;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, init, true);
  } catch (error) {
    const isAuthPath = path.startsWith("/auth/");
    if (!(error instanceof ApiError) || error.status !== 401 || isAuthPath) throw error;
    try {
      await refreshSession();
      return await rawRequest<T>(path, init, false);
    } catch (refreshError) {
      setAccessToken(null);
      authenticationLost?.();
      throw refreshError;
    }
  }
}

async function rawRequest<T>(
  path: string,
  init: RequestInit,
  includeAccessToken: boolean,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (includeAccessToken && accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("X-Correlation-ID") && typeof crypto !== "undefined" && "randomUUID" in crypto) {
    headers.set("X-Correlation-ID", crypto.randomUUID());
  }
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("json") ? (response.json() as Promise<T>) : (undefined as T);
}

async function toApiError(response: Response): Promise<ApiError> {
  let problem: ProblemDetails | undefined;
  try {
    problem = (await response.json()) as ProblemDetails;
  } catch {
    problem = undefined;
  }
  return new ApiError(response.status, undefined, problem);
}

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ProblemDetail } from '@/lib/types';

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** Session-scoped token holder. Kept in memory only (never localStorage). */
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ProblemDetail>) => {
    const status = error.response?.status;

    // 401 means "I don't know who you are": the token is missing, expired or
    // invalid, so drop it and send the user to log in again.
    //
    // 403 is deliberately NOT treated the same way. It means "I know exactly
    // who you are, and you may not do this" — a role check, or a sanction.
    // Logging the user out on a 403 would throw a perfectly valid admin
    // session away the moment they touched a page they lack rights for, and
    // the login screen would hand them back the same identity that just got
    // refused. The caller renders the message instead.
    if (status === 401) {
      authToken = null;
      if (!window.location.pathname.startsWith('/login')) {
        const from = window.location.pathname + window.location.search;
        window.location.assign(`/login?from=${encodeURIComponent(from)}`);
      }
    }

    return Promise.reject(error);
  }
);

/** Normalise an Axios error into a human-readable message. */
export function errorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado'
): string {
  const axiosErr = error as AxiosError<ProblemDetail>;
  if (axiosErr?.response) {
    const { status, data } = axiosErr.response;
    if (status === 409) {
      return data?.detail ?? data?.message ?? 'Conflicto con el estado actual del recurso';
    }
    if (status === 400) {
      if (data?.violations?.length) {
        return data.violations.map((v) => v.message).join(', ');
      }
      return data?.detail ?? data?.message ?? 'Los datos enviados no son válidos';
    }
    if (status === 404) {
      return data?.detail ?? 'El recurso solicitado no existe';
    }
    if (status === 403) {
      // A sanction is a 403 whose detail names the reason and the end date —
      // far more useful to the user than a generic "no permission".
      return data?.detail ?? 'No tienes permisos para realizar esta acción';
    }
    if (status === 401) {
      return data?.detail ?? 'Tu sesión expiró. Inicia sesión de nuevo.';
    }
    if (status >= 500) {
      return data?.detail ?? 'Error en el servidor. Inténtalo de nuevo más tarde.';
    }
    return data?.detail ?? data?.message ?? fallback;
  }
  if (axiosErr?.code === 'ERR_NETWORK' || !axiosErr?.response) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }
  return fallback;
}

export const ERROR_MESSAGE = errorMessage;

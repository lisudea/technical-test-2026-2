// ─── API Error ──────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errores?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Token helpers ───────────────────────────────────────────────────────────
export function getToken(): string | null {
  return sessionStorage.getItem("lis_token");
}

export function storeSession(token: string) {
  sessionStorage.setItem("lis_token", token);
  sessionStorage.setItem("lis_admin", "true");
}

export function clearSession() {
  sessionStorage.removeItem("lis_token");
  sessionStorage.removeItem("lis_admin");
}

// ─── Date helpers ────────────────────────────────────────────────────────────
// Normalise a datetime-local value ("2026-08-09T10:00") to the ISO format the
// backend expects ("2026-08-09T10:00:00"). If seconds are already present the
// string is returned unchanged.
export function toIsoDateTime(value: string): string {
  return /T\d{2}:\d{2}:\d{2}/.test(value) ? value : `${value}:00`;
}

// Convert a date-only input ("2026-08-01") to a LocalDateTime string suitable
// for query params, optionally at end-of-day.
export function dateToIsoDateTime(date: string, endOfDay = false): string {
  return endOfDay ? `${date}T23:59:59` : `${date}T00:00:00`;
}

// ─── Error parser ────────────────────────────────────────────────────────────
async function parseError(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();
    if (body.errores && typeof body.errores === "object") {
      const msg = Object.values(body.errores as Record<string, string>).join(" · ");
      return new ApiError(res.status, msg, body.errores as Record<string, string>);
    }
    return new ApiError(res.status, body.message ?? `Error ${res.status}`);
  } catch {
    return new ApiError(res.status, `Error ${res.status}`);
  }
}

// ─── Core request ────────────────────────────────────────────────────────────
// `auth: true`  → attach JWT; redirect to /login on 401/403
// `auth: false` → public endpoint; 403 surfaces as ApiError (not redirect)
export async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string> | undefined),
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, { headers, ...rest });

  // Authenticated endpoints → redirect on session failure
  if (auth && (res.status === 401 || res.status === 403)) {
    clearSession();
    window.location.href = "/login";
    throw new ApiError(res.status, "Sesión expirada. Redirigiendo al login…");
  }

  if (!res.ok) throw await parseError(res);

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

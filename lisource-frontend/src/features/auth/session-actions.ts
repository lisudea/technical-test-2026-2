import type { SessionDto } from "@/types";

interface SessionActions {
  logout: () => Promise<void>;
  revokeSession: (sessionId: number) => Promise<void>;
}

export async function revokeSessionOrLogout(session: SessionDto, actions: SessionActions) {
  if (session.current) {
    await actions.logout();
    return "logged-out" as const;
  }

  await actions.revokeSession(session.id);
  return "revoked" as const;
}

interface LogoutFlow {
  revokeServerSession: () => Promise<unknown>;
  clearAccessToken: () => void;
  clearAuthenticationState: () => void;
  clearAuthenticatedCache: () => void;
  disconnectRealtime: () => Promise<void>;
  redirectToLogin: () => Promise<void> | void;
}

export async function completeLogout(flow: LogoutFlow) {
  try {
    await flow.revokeServerSession();
  } catch {
    // A missing or expired server session must never prevent local logout.
  }

  flow.clearAccessToken();
  flow.clearAuthenticationState();
  flow.clearAuthenticatedCache();
  await flow.disconnectRealtime();
  await flow.redirectToLogin();
}

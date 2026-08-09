import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { completeLogout } from "./logout-flow";

const mocks = {
  revokeServerSession: vi.fn(async () => undefined),
  disconnectRealtime: vi.fn(async () => undefined),
  redirectToLogin: vi.fn(async () => undefined),
};

function authenticatedFixture() {
  const state: {
    accessToken: string | null;
    user: { id: number } | null;
    activeRole: string | null;
    selectionToken: string | null;
    availableRoles: string[];
  } = {
    accessToken: "test-access-token",
    user: { id: 7 },
    activeRole: "USUARIO",
    selectionToken: "temporary-selection-token",
    availableRoles: ["USUARIO", "ADMINISTRADOR"],
  };
  const queryClient = new QueryClient();
  queryClient.setQueryData(["profile"], { id: 7 });
  queryClient.setQueryData(["reservations"], [{ id: 12 }]);

  return {
    state,
    queryClient,
    flow: {
      revokeServerSession: mocks.revokeServerSession,
      clearAccessToken: () => {
        state.accessToken = null;
      },
      clearAuthenticationState: () => {
        state.user = null;
        state.activeRole = null;
        state.selectionToken = null;
        state.availableRoles = [];
      },
      clearAuthenticatedCache: () => queryClient.clear(),
      disconnectRealtime: mocks.disconnectRealtime,
      redirectToLogin: mocks.redirectToLogin,
    },
  };
}

describe("completeLogout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clears auth state, authenticated cache and realtime before redirecting", async () => {
    const { state, queryClient, flow } = authenticatedFixture();

    await completeLogout(flow);

    expect(state).toEqual({
      accessToken: null,
      user: null,
      activeRole: null,
      selectionToken: null,
      availableRoles: [],
    });
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(mocks.disconnectRealtime).toHaveBeenCalledOnce();
    expect(mocks.redirectToLogin).toHaveBeenCalledOnce();
  });

  it("still clears and redirects when backend revocation fails", async () => {
    mocks.revokeServerSession.mockRejectedValueOnce(new Error("expired session"));
    const { state, queryClient, flow } = authenticatedFixture();

    await expect(completeLogout(flow)).resolves.toBeUndefined();

    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(mocks.disconnectRealtime).toHaveBeenCalledOnce();
    expect(mocks.redirectToLogin).toHaveBeenCalledOnce();
  });

  it("supports logout-all through the same complete client cleanup", async () => {
    const logoutAll = vi.fn(async () => ({ revokedSessions: 3 }));
    const { state, flow } = authenticatedFixture();

    await completeLogout({ ...flow, revokeServerSession: logoutAll });

    expect(logoutAll).toHaveBeenCalledOnce();
    expect(state.user).toBeNull();
    expect(mocks.disconnectRealtime).toHaveBeenCalledOnce();
    expect(mocks.redirectToLogin).toHaveBeenCalledOnce();
  });
});

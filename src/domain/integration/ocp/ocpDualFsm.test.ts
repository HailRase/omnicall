import { describe, expect, it } from "vitest";
import {
  deriveIsOcpAuthenticated,
  deriveLegacyOcpConnectionState,
  initialOcpDualFsmSnapshot,
  reduceOcpAuthorizationState,
  reduceOcpDualFsm,
  reduceOcpServerState,
  resolveAllowedOcpRecoveryAction,
  selectPrimaryOcpRecoveryAction,
} from "./ocpDualFsm.js";
import {
  idleOcpAuthorizationState,
  pendingOcpAuthorizationState,
} from "./OcpAuthorizationState.js";

describe("ocpDualFsm", () => {
  it("reduces server transport states without touching auth", () => {
    expect(reduceOcpServerState("disconnected", { type: "connect_requested" })).toBe(
      "connecting",
    );
    expect(reduceOcpServerState("connecting", { type: "transport_connected" })).toBe(
      "connected",
    );
    expect(reduceOcpServerState("connected", { type: "reconnect_requested" })).toBe(
      "reconnecting",
    );
    expect(reduceOcpServerState("reconnecting", { type: "transport_failed" })).toBe(
      "failed",
    );
    expect(reduceOcpServerState("failed", { type: "manual_disconnect" })).toBe(
      "disconnected",
    );
  });

  it("reduces authorization phases independently", () => {
    expect(
      reduceOcpAuthorizationState(idleOcpAuthorizationState(), { type: "auth_requested" }),
    ).toEqual({ phase: "pending" });
    expect(
      reduceOcpAuthorizationState(pendingOcpAuthorizationState(), {
        type: "auth_succeeded",
      }),
    ).toEqual({ phase: "authorized" });
    expect(
      reduceOcpAuthorizationState(pendingOcpAuthorizationState(), {
        type: "auth_timeout",
      }),
    ).toEqual({ phase: "timeout" });
    expect(
      reduceOcpAuthorizationState(pendingOcpAuthorizationState(), {
        type: "auth_rejected",
        reason: "SESSION_EXIST",
      }),
    ).toEqual({ phase: "rejected", reason: "SESSION_EXIST" });
  });

  it("derives legacy authenticated / sessionClosed bridges", () => {
    let snapshot = initialOcpDualFsmSnapshot();
    snapshot = reduceOcpDualFsm(snapshot, {
      kind: "server",
      transition: { type: "connect_requested" },
    });
    snapshot = reduceOcpDualFsm(snapshot, {
      kind: "server",
      transition: { type: "transport_connected" },
    });
    expect(deriveLegacyOcpConnectionState(snapshot)).toBe("connected");
    expect(deriveIsOcpAuthenticated(snapshot)).toBe(false);

    snapshot = reduceOcpDualFsm(snapshot, {
      kind: "authorization",
      transition: { type: "auth_succeeded" },
    });
    expect(deriveLegacyOcpConnectionState(snapshot)).toBe("authenticated");
    expect(deriveIsOcpAuthenticated(snapshot)).toBe(true);

    snapshot = reduceOcpDualFsm(snapshot, { kind: "terminate" });
    expect(deriveLegacyOcpConnectionState(snapshot)).toBe("sessionClosed");
    expect(deriveIsOcpAuthenticated(snapshot)).toBe(false);
  });

  it("guards recovery actions per ADR-AF-002 table", () => {
    const failed = reduceOcpDualFsm(initialOcpDualFsmSnapshot(), {
      kind: "server",
      transition: { type: "transport_failed" },
    });
    expect(resolveAllowedOcpRecoveryAction(failed, "retry_server")).toBe("retry_server");
    expect(resolveAllowedOcpRecoveryAction(failed, "retry_authorization")).toBeNull();

    let authTimeout = reduceOcpDualFsm(initialOcpDualFsmSnapshot(), {
      kind: "server",
      transition: { type: "transport_connected" },
    });
    authTimeout = reduceOcpDualFsm(authTimeout, {
      kind: "authorization",
      transition: { type: "auth_timeout" },
    });
    expect(resolveAllowedOcpRecoveryAction(authTimeout, "retry_authorization")).toBe(
      "retry_authorization",
    );
    expect(resolveAllowedOcpRecoveryAction(authTimeout, "retry_server")).toBeNull();

    let sessionExist = reduceOcpDualFsm(initialOcpDualFsmSnapshot(), {
      kind: "server",
      transition: { type: "transport_connected" },
    });
    sessionExist = reduceOcpDualFsm(sessionExist, {
      kind: "authorization",
      transition: { type: "auth_rejected", reason: "SESSION_EXIST" },
    });
    expect(resolveAllowedOcpRecoveryAction(sessionExist, "retry_server")).toBe(
      "retry_server",
    );
    expect(resolveAllowedOcpRecoveryAction(sessionExist, "retry_authorization")).toBeNull();
    expect(selectPrimaryOcpRecoveryAction(sessionExist)).toBe("retry_server");

    let authorized = reduceOcpDualFsm(initialOcpDualFsmSnapshot(), {
      kind: "server",
      transition: { type: "transport_connected" },
    });
    authorized = reduceOcpDualFsm(authorized, {
      kind: "authorization",
      transition: { type: "auth_succeeded" },
    });
    expect(resolveAllowedOcpRecoveryAction(authorized, "reconnect")).toBe("reconnect");
    expect(resolveAllowedOcpRecoveryAction(authorized, "retry_authorization")).toBeNull();

    // Stale authorized after transport failure still offers Retry server.
    const staleAuthorizedDown = reduceOcpDualFsm(authorized, {
      kind: "server",
      transition: { type: "transport_failed" },
    });
    expect(selectPrimaryOcpRecoveryAction(staleAuthorizedDown)).toBe("retry_server");
    expect(
      resolveAllowedOcpRecoveryAction(staleAuthorizedDown, "retry_server"),
    ).toBe("retry_server");
  });

  it("blocks recovery after terminate terminal state", () => {
    const terminated = reduceOcpDualFsm(initialOcpDualFsmSnapshot(), {
      kind: "terminate",
    });
    expect(resolveAllowedOcpRecoveryAction(terminated, "retry_server")).toBeNull();
    expect(selectPrimaryOcpRecoveryAction(terminated)).toBeNull();
  });
});

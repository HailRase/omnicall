/**
 * DI-07: callType "sdk" binding must not silently use "external" at the Facade.
 * OCP wire mapping (sdk → external) lives only in adapters (`mapOcpCallTypeToWire`).
 */

import { describe, expect, it, vi } from "vitest";

import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { ok } from "@shared/result/index.js";

import { createSdkOperatorPortFromFacade } from "./createSdkOperatorPortFromFacade.js";

describe("createSdkOperatorPortFromFacade", () => {
  it("passes callType sdk to changeOcpStatusFromHost", async () => {
    const changeOcpStatusFromHost = vi.fn(() =>
      Promise.resolve(
        ok({
          kind: "applied" as const,
          targetStatus: "break" as const,
          reasonId: 7,
        }),
      ),
    );
    const port = createSdkOperatorPortFromFacade({
      ocpModuleEnabled: true,
      facade: {
        changeOcpStatusFromHost,
        finishOcpPostCallAppeal: vi.fn(),
        getOcpReasonsSnapshot: () => ({
          readyReasons: [],
          breakReasons: [],
          logoutReasons: [],
        }),
        getOcpSessionSnapshot: () => ({
          isAuthenticated: true,
          connectionState: "authenticated",
        }),
        getOcpOperatorSnapshot: () => ({ operatorId: 1 }),
        logoutAccountSession: vi.fn(),
      },
    });
    await port.changeOperatorStatus({ targetStatus: "break", reasonId: 7 });
    expect(changeOcpStatusFromHost).toHaveBeenCalledWith({
      targetStatus: "break",
      reasonId: 7,
      callType: "sdk",
    });
  });

  it("passes callType sdk to finishOcpPostCallAppeal", async () => {
    const finishOcpPostCallAppeal = vi.fn(() =>
      Promise.resolve(
        ok({
          kind: "applied" as const,
          targetStatus: "ready" as const,
          reasonId: 1,
        }),
      ),
    );
    const port = createSdkOperatorPortFromFacade({
      ocpModuleEnabled: true,
      facade: {
        changeOcpStatusFromHost: vi.fn(),
        finishOcpPostCallAppeal,
        getOcpReasonsSnapshot: () => ({
          readyReasons: [],
          breakReasons: [],
          logoutReasons: [],
        }),
        getOcpSessionSnapshot: () => ({
          isAuthenticated: true,
          connectionState: "authenticated",
        }),
        getOcpOperatorSnapshot: () => ({ operatorId: 1 }),
        logoutAccountSession: vi.fn(),
      },
    });
    await port.finishPostCallAppeal();
    expect(finishOcpPostCallAppeal).toHaveBeenCalledWith({ callType: "sdk" });
  });

  it("SIP-only returns empty reasons and non-authenticated session view", () => {
    const port = createSdkOperatorPortFromFacade({
      ocpModuleEnabled: false,
      facade: {
        changeOcpStatusFromHost: vi.fn(),
        finishOcpPostCallAppeal: vi.fn(),
        getOcpReasonsSnapshot: () => ({
          readyReasons: [
            {
              id: 1,
              parentStatus: OperatorStatus.READY,
              defaultDescription: "Ready",
            },
          ],
          breakReasons: [],
          logoutReasons: [],
        }),
        getOcpSessionSnapshot: () => ({
          isAuthenticated: true,
          connectionState: "authenticated",
        }),
        getOcpOperatorSnapshot: () => ({ operatorId: 99 }),
        logoutAccountSession: vi.fn(),
      },
    });
    expect(port.listOperatorReasons()).toEqual([]);
    expect(port.readOcpSession()).toEqual({
      isAuthenticated: false,
      isLive: false,
      hasOperatorSnapshot: false,
    });
  });
});

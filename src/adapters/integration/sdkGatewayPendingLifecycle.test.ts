/**
 * Deferred Origin trust + pairing pending lifecycle (cancel vs deny / TTL).
 */

import { describe, expect, it } from "vitest";

import { DeferredSdkOriginTrustApprover } from "./sdkGatewayOriginTrustApprover.js";
import { DeferredSdkPairingApprover } from "./sdkGatewayPairingApprover.js";
import type { SdkPairingPendingRequest } from "./sdkGatewayPairingTypes.js";

function pairingPending(
  overrides: Partial<SdkPairingPendingRequest> = {},
): SdkPairingPendingRequest {
  return {
    pairingRequestId: "pair_1",
    clientId: "client_1",
    origin: "https://crm.example",
    connectionId: "conn_1",
    publicKey: "pk",
    keyAlgorithm: "ECDSA-P256-SHA256",
    profile: "presentation",
    requestedCapabilities: ["session.read.redacted"],
    applicationName: "CRM",
    applicationVersion: "1.0.0",
    expiresAt: "2026-07-22T12:00:00.000Z",
    createdAt: "2026-07-22T11:00:00.000Z",
    ...overrides,
  };
}

describe("sdkGatewayPendingLifecycle", () => {
  describe("DeferredSdkOriginTrustApprover", () => {
    it("cancelByOrigin resolves cancel (not deny)", async () => {
      const approver = new DeferredSdkOriginTrustApprover();
      const decisionPromise = approver.approver({
        originTrustRequestId: "origin_1",
        origin: "https://crm.example",
        createdAt: "2026-07-22T11:00:00.000Z",
      });

      expect(approver.cancelByOrigin("https://crm.example")).toBe(true);
      await expect(decisionPromise).resolves.toEqual({ decision: "cancel" });
      expect(approver.listPending()).toEqual([]);
    });

    it("cancelExpired cancels pending when createdAt is older than ttl", async () => {
      const approver = new DeferredSdkOriginTrustApprover();
      const decisionPromise = approver.approver({
        originTrustRequestId: "origin_old",
        origin: "https://crm.example",
        createdAt: "2026-07-22T10:00:00.000Z",
      });
      const freshPromise = approver.approver({
        originTrustRequestId: "origin_fresh",
        origin: "https://other.example",
        createdAt: "2026-07-22T11:55:00.000Z",
      });

      const nowMs = Date.parse("2026-07-22T12:00:00.000Z");
      const ttlMs = 30 * 60 * 1000;
      expect(approver.cancelExpired(nowMs, ttlMs)).toBe(1);
      await expect(decisionPromise).resolves.toEqual({ decision: "cancel" });
      expect(approver.listPending()).toHaveLength(1);
      expect(approver.listPending()[0]?.originTrustRequestId).toBe("origin_fresh");

      expect(approver.cancel("origin_fresh")).toBe(true);
      await expect(freshPromise).resolves.toEqual({ decision: "cancel" });
    });
  });

  describe("DeferredSdkPairingApprover", () => {
    it("denyByConnectionId denies only matching connection", async () => {
      const approver = new DeferredSdkPairingApprover();
      const matchPromise = approver.approver(
        pairingPending({
          pairingRequestId: "pair_match",
          connectionId: "conn_a",
        }),
      );
      const otherPromise = approver.approver(
        pairingPending({
          pairingRequestId: "pair_other",
          connectionId: "conn_b",
          clientId: "client_2",
        }),
      );

      expect(approver.denyByConnectionId("conn_a")).toBe(1);
      await expect(matchPromise).resolves.toEqual({ decision: "deny" });
      expect(approver.listPending()).toHaveLength(1);
      expect(approver.listPending()[0]?.pairingRequestId).toBe("pair_other");

      expect(approver.deny("pair_other")).toBe(true);
      await expect(otherPromise).resolves.toEqual({ decision: "deny" });
    });

    it("denyByOrigin denies all pending for that origin", async () => {
      const approver = new DeferredSdkPairingApprover();
      const first = approver.approver(
        pairingPending({
          pairingRequestId: "pair_a",
          connectionId: "conn_1",
          origin: "https://crm.example",
        }),
      );
      const second = approver.approver(
        pairingPending({
          pairingRequestId: "pair_b",
          connectionId: "conn_2",
          clientId: "client_2",
          origin: "https://crm.example",
        }),
      );
      const otherOrigin = approver.approver(
        pairingPending({
          pairingRequestId: "pair_c",
          connectionId: "conn_3",
          clientId: "client_3",
          origin: "https://other.example",
        }),
      );

      expect(approver.denyByOrigin("https://crm.example")).toBe(2);
      await expect(first).resolves.toEqual({ decision: "deny" });
      await expect(second).resolves.toEqual({ decision: "deny" });
      expect(approver.listPending()).toHaveLength(1);
      expect(approver.listPending()[0]?.pairingRequestId).toBe("pair_c");

      expect(approver.deny("pair_c")).toBe(true);
      await expect(otherOrigin).resolves.toEqual({ decision: "deny" });
    });

    it("denyExpired denies pending when expiresAt is in the past", async () => {
      const approver = new DeferredSdkPairingApprover();
      const expiredPromise = approver.approver(
        pairingPending({
          pairingRequestId: "pair_expired",
          connectionId: "conn_expired",
          expiresAt: "2026-07-22T11:00:00.000Z",
        }),
      );
      const livePromise = approver.approver(
        pairingPending({
          pairingRequestId: "pair_live",
          connectionId: "conn_live",
          clientId: "client_live",
          expiresAt: "2026-07-22T13:00:00.000Z",
        }),
      );

      const nowMs = Date.parse("2026-07-22T12:00:00.000Z");
      expect(approver.denyExpired(nowMs)).toBe(1);
      await expect(expiredPromise).resolves.toEqual({ decision: "deny" });
      expect(approver.listPending()).toHaveLength(1);
      expect(approver.listPending()[0]?.pairingRequestId).toBe("pair_live");

      expect(approver.deny("pair_live")).toBe(true);
      await expect(livePromise).resolves.toEqual({ decision: "deny" });
    });
  });
});

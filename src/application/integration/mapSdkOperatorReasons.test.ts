/**
 * Unit: public operator reason DTO mapper (ADR-0017 O-OCP-1).
 */

import { describe, expect, it } from "vitest";

import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createOperatorStatusReason } from "@domain/integration/ocp/OperatorStatusReason.js";

import {
  filterSdkReasonsByKind,
  mapSdkOperatorReasons,
  resolveSdkStatusReasonId,
} from "./mapSdkOperatorReasons.js";

describe("mapSdkOperatorReasons", () => {
  const projection = {
    readyReasons: [
      createOperatorStatusReason({
        id: 1,
        parentStatus: OperatorStatus.READY,
        defaultDescription: "Ready",
      }),
    ],
    breakReasons: [
      createOperatorStatusReason({
        id: 7,
        parentStatus: OperatorStatus.BREAK,
        defaultDescription: "Break",
      }),
    ],
    logoutReasons: [
      createOperatorStatusReason({
        id: 90,
        parentStatus: OperatorStatus.LOGOUT,
        defaultDescription: "End of shift",
      }),
    ],
  };

  it("maps ready/break/logout labels without OCP wire fields", () => {
    const mapped = mapSdkOperatorReasons(projection);
    expect(mapped).toEqual([
      { id: 1, label: "Ready", kind: "ready" },
      { id: 7, label: "Break", kind: "break" },
      { id: 90, label: "End of shift", kind: "logout" },
    ]);
    expect(JSON.stringify(mapped)).not.toMatch(/apiKey|operator_id|proxy/i);
  });

  it("resolves ready default and rejects missing break reason", () => {
    const reasons = mapSdkOperatorReasons(projection);
    expect(resolveSdkStatusReasonId("ready", undefined, reasons)).toBe(1);
    expect(resolveSdkStatusReasonId("break", undefined, reasons)).toBeNull();
    expect(resolveSdkStatusReasonId("break", 7, reasons)).toBe(7);
    expect(resolveSdkStatusReasonId("break", 99, reasons)).toBeNull();
  });

  it("filters logout reasons for interaction_required", () => {
    const reasons = mapSdkOperatorReasons(projection);
    expect(filterSdkReasonsByKind(reasons, "logout")).toEqual([
      { id: 90, label: "End of shift", kind: "logout" },
    ]);
  });
});

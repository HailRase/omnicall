import { describe, expect, it } from "vitest";

import { OperatorStatus } from "./OperatorStatus.js";
import {
  canUserInitiate,
  isBusy,
  resolveOperatorStatusChangeMode,
  validateTransition,
} from "./OperatorStatusMachine.js";

describe("OperatorStatusMachine", () => {
  it("allows user-initiated transitions from READY, BREAK, and PREPARING_TO_WORK", () => {
    expect(validateTransition(OperatorStatus.READY, OperatorStatus.BREAK)).toEqual({
      ok: true,
    });
    expect(validateTransition(OperatorStatus.READY, OperatorStatus.LOGOUT)).toEqual({
      ok: true,
    });
    expect(validateTransition(OperatorStatus.READY, OperatorStatus.READY)).toEqual({
      ok: true,
    });
    expect(validateTransition(OperatorStatus.BREAK, OperatorStatus.READY)).toEqual({
      ok: true,
    });
    expect(validateTransition(OperatorStatus.BREAK, OperatorStatus.BREAK)).toEqual({
      ok: true,
    });
    expect(
      validateTransition(OperatorStatus.PREPARING_TO_WORK, OperatorStatus.READY),
    ).toEqual({ ok: true });
    expect(
      validateTransition(OperatorStatus.PREPARING_TO_WORK, OperatorStatus.BREAK),
    ).toEqual({ ok: true });
    expect(
      validateTransition(OperatorStatus.PREPARING_TO_WORK, OperatorStatus.LOGOUT),
    ).toEqual({ ok: true });
  });

  it("rejects server-driven and busy transitions", () => {
    expect(validateTransition(OperatorStatus.READY, OperatorStatus.RINGING)).toEqual({
      ok: false,
      error: "transition_not_allowed",
    });
    expect(validateTransition(OperatorStatus.TALKING, OperatorStatus.BREAK)).toEqual({
      ok: false,
      error: "transition_not_allowed",
    });
  });

  it("allows post-call processing to return to ready or break", () => {
    expect(
      validateTransition(OperatorStatus.POST_CALL_PROCESSING, OperatorStatus.READY),
    ).toEqual({ ok: true });
    expect(
      validateTransition(OperatorStatus.POST_CALL_PROCESSING, OperatorStatus.BREAK),
    ).toEqual({ ok: true });
    expect(
      validateTransition(OperatorStatus.POST_CALL_PROCESSING, OperatorStatus.LOGOUT),
    ).toEqual({ ok: true });
  });

  it("evaluates busy and user-initiate predicates", () => {
    expect(isBusy(OperatorStatus.TALKING)).toBe(true);
    expect(isBusy(OperatorStatus.READY)).toBe(false);
    expect(isBusy(OperatorStatus.PREPARING_TO_WORK)).toBe(false);
    expect(canUserInitiate(OperatorStatus.READY)).toBe(true);
    expect(canUserInitiate(OperatorStatus.RINGING)).toBe(false);
    expect(canUserInitiate(OperatorStatus.LOGOUT)).toBe(true);
  });

  it("resolves change mode for idle, busy, and post-call", () => {
    expect(resolveOperatorStatusChangeMode(OperatorStatus.READY)).toBe("direct");
    expect(resolveOperatorStatusChangeMode(OperatorStatus.BREAK)).toBe("direct");
    expect(resolveOperatorStatusChangeMode(OperatorStatus.PREPARING_TO_WORK)).toBe(
      "direct",
    );
    expect(resolveOperatorStatusChangeMode(OperatorStatus.TALKING)).toBe("reserve");
    expect(resolveOperatorStatusChangeMode(OperatorStatus.RESERVED_TO_CALL)).toBe(
      "reserve",
    );
    expect(resolveOperatorStatusChangeMode(OperatorStatus.RINGING)).toBe("reserve");
    expect(resolveOperatorStatusChangeMode(OperatorStatus.PRE_CALL_PROCESSING)).toBe(
      "reserve",
    );
    expect(resolveOperatorStatusChangeMode(OperatorStatus.POST_CALL_PROCESSING)).toBe(
      "choose",
    );
  });
});

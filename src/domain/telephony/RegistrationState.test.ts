import { describe, expect, it } from "vitest";
import {
  initialRegistrationState,
  transitionRegistrationState,
} from "./RegistrationState.js";

describe("RegistrationStateMachine", () => {
  it("starts idle", () => {
    expect(initialRegistrationState()).toBe("idle");
  });

  it("moves idle to registering on request", () => {
    const result = transitionRegistrationState("idle", "registration_requested");
    expect(result).toEqual({ ok: true, state: "registering" });
  });

  it("completes successful registration", () => {
    const registering = transitionRegistrationState(
      "idle",
      "registration_requested",
    );
    expect(registering.ok).toBe(true);
    if (!registering.ok) {
      return;
    }

    const registered = transitionRegistrationState(
      registering.state,
      "registration_succeeded",
    );
    expect(registered).toEqual({ ok: true, state: "registered" });
  });

  it("rejects success from idle", () => {
    const result = transitionRegistrationState("idle", "registration_succeeded");
    expect(result.ok).toBe(false);
  });
});

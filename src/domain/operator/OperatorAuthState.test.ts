import { describe, expect, it } from "vitest";
import {
  initialOperatorAuthState,
  transitionOperatorAuthState,
} from "./OperatorAuthState.js";

describe("OperatorAuthState", () => {
  it("starts idle", () => {
    expect(initialOperatorAuthState()).toBe("idle");
  });

  it("moves idle to authenticating on request", () => {
    const result = transitionOperatorAuthState("idle", "auth_requested");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state).toBe("authenticating");
    }
  });

  it("completes successful authentication", () => {
    let state = initialOperatorAuthState();
    const requested = transitionOperatorAuthState(state, "auth_requested");
    if (!requested.ok) {
      throw new Error("expected auth_requested to succeed");
    }
    state = requested.state;

    const succeeded = transitionOperatorAuthState(state, "auth_succeeded");
    expect(succeeded.ok).toBe(true);
    if (succeeded.ok) {
      expect(succeeded.state).toBe("authenticated");
    }
  });

  it("rejects success from idle", () => {
    const result = transitionOperatorAuthState("idle", "auth_succeeded");
    expect(result.ok).toBe(false);
  });
});

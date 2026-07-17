import { describe, expect, it } from "vitest";
import {
  createReadyAccountSignInOutcome,
  createSipRegistrationFailedAccountSignInOutcome,
} from "@domain/settings/AccountSignInOutcome.js";
import {
  deriveAccountSignInNotificationFeedback,
  shouldAttachOpenSystemStateAction,
} from "./deriveAccountSignInNotificationFeedback.js";

describe("deriveAccountSignInNotificationFeedback", () => {
  it("splits SIP-only ready into transport then registration success keys", () => {
    expect(
      deriveAccountSignInNotificationFeedback({
        outcome: createReadyAccountSignInOutcome(),
        mode: "sip_only",
      }),
    ).toEqual({
      successKeys: [
        "account.success.sipTransportConnected",
        "account.success.sipRegistrationSucceeded",
      ],
      error: null,
      attachOpenSystemStateAction: false,
    });
  });

  it("keeps OCP ready as a single combined success key", () => {
    expect(
      deriveAccountSignInNotificationFeedback({
        outcome: createReadyAccountSignInOutcome(),
        mode: "ocp",
      }).successKeys,
    ).toEqual(["account.success.ocpAndSipReady"]);
  });

  it("shows transport success plus registration error when transport was up", () => {
    const feedback = deriveAccountSignInNotificationFeedback({
      outcome: createSipRegistrationFailedAccountSignInOutcome({
        detail: "Authentication Error",
        transportConnected: true,
      }),
      mode: "sip_only",
    });

    expect(feedback.successKeys).toEqual(["account.success.sipTransportConnected"]);
    expect(feedback.error).toEqual({ key: "account.error.invalidCredentials" });
    expect(feedback.attachOpenSystemStateAction).toBe(true);
  });

  it("shows only connection error when transport never connected", () => {
    const feedback = deriveAccountSignInNotificationFeedback({
      outcome: createSipRegistrationFailedAccountSignInOutcome({
        detail: "Connection Error",
        transportConnected: false,
      }),
      mode: "sip_only",
    });

    expect(feedback.successKeys).toEqual([]);
    expect(feedback.error).toEqual({ key: "account.error.networkOrTransport" });
    expect(feedback.attachOpenSystemStateAction).toBe(true);
  });

  it("uses profileUpdated when overwriting credentials", () => {
    expect(
      deriveAccountSignInNotificationFeedback({
        outcome: createReadyAccountSignInOutcome(),
        mode: "sip_only",
        overwriteExistingCredentials: true,
      }).successKeys,
    ).toEqual(["account.success.profileUpdated"]);
  });
});

describe("shouldAttachOpenSystemStateAction", () => {
  it("attaches for transport and registration errors only", () => {
    expect(
      shouldAttachOpenSystemStateAction({ key: "account.error.networkOrTransport" }),
    ).toBe(true);
    expect(
      shouldAttachOpenSystemStateAction({ key: "account.error.validationFailed" }),
    ).toBe(false);
  });
});

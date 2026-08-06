import { describe, expect, it } from "vitest";
import {
  createReadyAccountSignInOutcome,
  createSipRegistrationFailedAccountSignInOutcome,
} from "@domain/settings/AccountSignInOutcome.js";
import {
  assignAccountSignInErrorChannels,
  classifyAccountSignInErrorPresentation,
  deriveAccountSignInNotificationFeedback,
  shouldAttachOpenSystemStateAction,
} from "./deriveAccountSignInNotificationFeedback.js";

describe("classifyAccountSignInErrorPresentation", () => {
  it("routes validation and missing profile to inline Alert", () => {
    expect(
      classifyAccountSignInErrorPresentation({ key: "account.error.validationFailed" }),
    ).toBe("inline_alert");
    expect(
      classifyAccountSignInErrorPresentation({ key: "account.error.profileNotFound" }),
    ).toBe("inline_alert");
  });

  it("routes server/register/transport/credentials failures to notification", () => {
    expect(
      classifyAccountSignInErrorPresentation({ key: "account.error.networkOrTransport" }),
    ).toBe("notification");
    expect(
      classifyAccountSignInErrorPresentation({
        key: "account.error.serverRegistration",
        params: { detail: "403 Forbidden" },
      }),
    ).toBe("notification");
    expect(
      classifyAccountSignInErrorPresentation({ key: "account.error.invalidCredentials" }),
    ).toBe("notification");
    expect(
      classifyAccountSignInErrorPresentation({ key: "account.error.authorizationFailed" }),
    ).toBe("notification");
  });
});

describe("assignAccountSignInErrorChannels", () => {
  it("keeps validation on Alert and clears notification slot", () => {
    expect(
      assignAccountSignInErrorChannels({ key: "account.error.validationFailed" }),
    ).toEqual({
      inlineError: { key: "account.error.validationFailed" },
      notificationError: null,
      attachOpenSystemStateAction: false,
    });
  });

  it("routes 403-class registration failure to notification with System State CTA", () => {
    const error = {
      key: "account.error.serverRegistration" as const,
      params: { detail: "403 Forbidden" },
    };
    expect(assignAccountSignInErrorChannels(error)).toEqual({
      inlineError: null,
      notificationError: error,
      attachOpenSystemStateAction: true,
    });
  });

  it("suppresses notification when another surface owns the failure", () => {
    expect(
      assignAccountSignInErrorChannels(
        { key: "account.error.authorizationFailed" },
        { suppressNotification: true },
      ),
    ).toEqual({
      inlineError: null,
      notificationError: null,
      attachOpenSystemStateAction: false,
    });
  });
});

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
      inlineError: null,
      notificationError: null,
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

  it("shows transport success plus notification registration error when transport was up", () => {
    const feedback = deriveAccountSignInNotificationFeedback({
      outcome: createSipRegistrationFailedAccountSignInOutcome({
        detail: "Authentication Error",
        transportConnected: true,
      }),
      mode: "sip_only",
    });

    expect(feedback.successKeys).toEqual(["account.success.sipTransportConnected"]);
    expect(feedback.inlineError).toBeNull();
    expect(feedback.notificationError).toEqual({ key: "account.error.invalidCredentials" });
    expect(feedback.attachOpenSystemStateAction).toBe(true);
  });

  it("shows only connection notification error when transport never connected", () => {
    const feedback = deriveAccountSignInNotificationFeedback({
      outcome: createSipRegistrationFailedAccountSignInOutcome({
        detail: "Connection Error",
        transportConnected: false,
      }),
      mode: "sip_only",
    });

    expect(feedback.successKeys).toEqual([]);
    expect(feedback.inlineError).toBeNull();
    expect(feedback.notificationError).toEqual({ key: "account.error.networkOrTransport" });
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

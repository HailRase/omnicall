import { describe, expect, it } from "vitest";
import { createSettingsAccountKey } from "@domain/index.js";
import {
  createAccountSignInLogoutRequiredError,
  validateAccountSignInCommand,
} from "./accountSignInCommand.js";

describe("accountSignInCommand", () => {
  it("accepts sip_only new draft with required fields", () => {
    const result = validateAccountSignInCommand({
      mode: "sip_only",
      profile: { kind: "new_draft" },
      sip: {
        username: "1001",
        domain: "pbx.example",
        server: "sip:pbx.example",
        password: "secret",
      },
    });
    expect(result.ok).toBe(true);
  });

  it("accepts saved sip profile without password at boundary", () => {
    const result = validateAccountSignInCommand({
      mode: "sip_only",
      profile: { kind: "saved", profileId: createSettingsAccountKey("1001@pbx.example") },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects ocp new draft without domain/api key", () => {
    const result = validateAccountSignInCommand({
      mode: "ocp",
      profile: { kind: "new_draft" },
      ocp: { login: "1001" },
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toBe("account.signIn.validation.ocpConfigRequired");
  });

  it("accepts ocp new draft with domain and api key", () => {
    const result = validateAccountSignInCommand({
      mode: "ocp",
      profile: { kind: "new_draft" },
      ocp: {
        login: "1001",
        domain: "ocp.example",
        apiKey: "proxy-key",
      },
    });
    expect(result.ok).toBe(true);
  });

  it("accepts ocp new draft even when sip-only fields are empty or missing", () => {
    const result = validateAccountSignInCommand({
      mode: "ocp",
      profile: { kind: "new_draft" },
      ocp: {
        login: "agent",
        domain: "ocp.example",
        apiKey: "proxy-key",
      },
      sip: {
        username: "",
        domain: "",
        server: "",
      },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects sip_only when only ocp fields are filled", () => {
    const result = validateAccountSignInCommand({
      mode: "sip_only",
      profile: { kind: "new_draft" },
      ocp: {
        login: "agent",
        domain: "ocp.example",
        apiKey: "proxy-key",
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toBe("account.signIn.validation.sipFieldsRequired");
  });

  it("builds logout-required error with semantic reason key", () => {
    const error = createAccountSignInLogoutRequiredError();
    expect(error.message).toBe("account_sign_in_logout_required");
    expect(error.cause).toEqual({ reason: "account.signIn.disabled.logoutFirst" });
  });
});

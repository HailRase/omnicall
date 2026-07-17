import { describe, expect, it } from "vitest";
import { createSettingsAccountKey } from "@application/index.js";
import {
  buildAccountSignInCommand,
  deriveOcpConfigFieldVisibility,
  recoveryActionTestId,
} from "./accountActionsHelpers.js";

describe("accountActionsHelpers", () => {
  it("shows all OCP config fields for a new draft", () => {
    expect(
      deriveOcpConfigFieldVisibility({
        selectedProfileId: null,
        hasCompleteOcpConfiguration: false,
        hasSavedOcpApiKey: false,
        ocpDomain: undefined,
      }),
    ).toEqual({ showDomain: true, showApiKey: true });
  });

  it("shows OCP config fields for a complete saved profile", () => {
    expect(
      deriveOcpConfigFieldVisibility({
        selectedProfileId: createSettingsAccountKey("a@b"),
        hasCompleteOcpConfiguration: true,
        hasSavedOcpApiKey: true,
        ocpDomain: "ocp.example",
      }),
    ).toEqual({ showDomain: true, showApiKey: true });
  });

  it("keeps OCP config fields visible for saved profiles", () => {
    expect(
      deriveOcpConfigFieldVisibility({
        selectedProfileId: createSettingsAccountKey("a@b"),
        hasCompleteOcpConfiguration: false,
        hasSavedOcpApiKey: true,
        ocpDomain: undefined,
      }),
    ).toEqual({ showDomain: true, showApiKey: true });
  });

  it("builds SIP-only remembered-password command without password field", () => {
    const profileId = createSettingsAccountKey("1001@pbx.example.com");
    const command = buildAccountSignInCommand({
      mode: "sip_only",
      selectedProfileId: profileId,
      form: {
        username: "1001",
        password: "",
        domain: "pbx.example.com",
        server: "wss://sip.example.com",
      },
      ocp: { login: "", domain: "", apiKey: "" },
      saveProfile: false,
      rememberPassword: false,
      passwordFieldVisible: false,
      showOcpDomain: false,
      showOcpApiKey: false,
    });

    expect(command).toEqual({
      mode: "sip_only",
      profile: { kind: "saved", profileId },
      sip: {
        username: "1001",
        domain: "pbx.example.com",
        server: "wss://sip.example.com",
      },
    });
  });

  it("builds OCP command from OCP draft only and keeps rememberPassword until entity:creds", () => {
    const command = buildAccountSignInCommand({
      mode: "ocp",
      selectedProfileId: null,
      form: {
        username: "stale-sip-user",
        password: "",
        domain: "stale-sip.domain",
        server: "wss://stale.example",
      },
      ocp: {
        login: "agent",
        domain: "ocp.example",
        apiKey: "proxy-key",
      },
      saveProfile: true,
      rememberPassword: true,
      passwordFieldVisible: false,
      showOcpDomain: true,
      showOcpApiKey: true,
    });

    expect(command).toEqual({
      mode: "ocp",
      profile: { kind: "new_draft" },
      ocp: {
        login: "agent",
        domain: "ocp.example",
        apiKey: "proxy-key",
      },
      sip: {
        username: "agent",
        domain: "ocp.example",
        server: "sip:ocp.example",
      },
      save: {
        saveProfile: true,
        rememberPassword: true,
        saveOcpApiKey: true,
      },
    });
  });

  it("maps recovery actions to canonical test ids", () => {
    expect(recoveryActionTestId("retry_server")).toBe("account-retry-server");
    expect(recoveryActionTestId("retry_authorization")).toBe(
      "account-retry-authorization",
    );
    expect(recoveryActionTestId("reconnect")).toBe("account-reconnect");
  });
});

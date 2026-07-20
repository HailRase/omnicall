// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SDK_INTEGRATION_DEFAULTS } from "@application/index.js";
import { setRendererLanguage } from "../../../i18n/index.js";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { SdkModuleSettingsCard } from "./SdkModuleSettingsCard.js";
import type { SdkModuleSettingsCardProps } from "./sdkModuleSettingsCardTypes.js";

beforeEach(() => {
  setupJsdomRadix();
  setRendererLanguage("en");
});

afterEach(() => {
  cleanup();
  setRendererLanguage("ru");
});

function createProps(
  overrides: Partial<SdkModuleSettingsCardProps> = {},
): SdkModuleSettingsCardProps {
  return {
    settings: { ...SDK_INTEGRATION_DEFAULTS, enabled: true, originsManaged: true },
    diagnostics: {
      status: "listening",
      bindHost: "127.0.0.1",
      bindPort: 17341,
      connectionCount: 0,
      authenticatedCount: 0,
      unauthenticatedCount: 0,
      pendingPairingCount: 1,
      pairedClientCount: 1,
      allowedOriginsCount: 1,
      lastErrorCode: null,
      windowHideAvailable: false,
    },
    allowedOriginsLive: ["https://crm.example"],
    pairedClients: [
      {
        clientId: "cli_1",
        origin: "https://crm.example",
        profile: "presentation",
        applicationName: "CRM",
        createdAt: "2026-07-20T00:00:00.000Z",
        expiresAt: null,
        revoked: false,
        capabilityCount: 2,
      },
    ],
    pendingPairing: [
      {
        pairingRequestId: "pair_1",
        clientId: "cli_2",
        origin: "https://crm.example",
        applicationName: "CRM Tab",
        profile: "presentation",
        expiresAt: "2026-07-20T01:00:00.000Z",
      },
    ],
    profileOptions: [{ id: "user@host|sip", label: "user@host" }],
    selectedClientId: "cli_1",
    selectedProfileId: "user@host|sip",
    lastGrant: { ok: true, profileRef: "prf_opaque" },
    originsDraft: "https://crm.example",
    errorKey: null,
    busy: false,
    onEnabledChange: vi.fn(),
    onOriginsDraftChange: vi.fn(),
    onOriginsSave: vi.fn(),
    onRefresh: vi.fn(),
    onApprovePairing: vi.fn(),
    onDenyPairing: vi.fn(),
    onRevokeClient: vi.fn(),
    onSelectClientId: vi.fn(),
    onSelectProfileId: vi.fn(),
    onIssueActivateGrant: vi.fn(),
    ...overrides,
  };
}

describe("SdkModuleSettingsCard", () => {
  it("renders card, disabled hide control, and grant without secrets", () => {
    render(<SdkModuleSettingsCard {...createProps()} />);

    expect(screen.getByTestId("sdk-module-settings-card")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-module-hide-toggle")).toBeDisabled();
    expect(screen.getByTestId("sdk-module-grant-ref")).toHaveTextContent("prf_opaque");
    expect(document.body.textContent ?? "").not.toMatch(
      /sip-password|ocp-api-key|Bearer |privateKey/i,
    );
  });

  it("approves pending pairing and issues activate grant via callbacks", async () => {
    const user = userEvent.setup();
    const props = createProps();
    render(<SdkModuleSettingsCard {...props} />);

    await user.click(screen.getByTestId("sdk-module-approve-pair_1"));
    expect(props.onApprovePairing).toHaveBeenCalledWith("pair_1");

    await user.click(screen.getByTestId("sdk-module-grant-issue"));
    expect(props.onIssueActivateGrant).toHaveBeenCalledTimes(1);
  });

  it("confirms revoke for a paired client without exposing secrets", async () => {
    const user = userEvent.setup();
    const props = createProps();
    render(<SdkModuleSettingsCard {...props} />);

    await user.click(screen.getByTestId("sdk-module-revoke-cli_1"));
    await user.click(screen.getByTestId("sdk-module-revoke-confirm-cli_1"));
    expect(props.onRevokeClient).toHaveBeenCalledWith("cli_1");
    expect(document.body.textContent ?? "").not.toMatch(
      /sip-password|ocp-api-key|Bearer |privateKey|pk_|sk_/i,
    );
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultSdkOriginCapabilityMatrix } from "@application/index.js";
import { SDK_OPERATOR_MODAL_TIMEOUT_DEFAULTS } from "@shared/integration/sdkOperatorModalTimeouts.js";
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
    settings: {
      originsManaged: true,
      origins: [
        {
          origin: "https://crm.example",
          state: "allowed",
          matrix: createDefaultSdkOriginCapabilityMatrix(),
          previouslyAllowed: true,
        },
        {
          origin: "https://blocked.example",
          state: "denied",
          matrix: null,
          previouslyAllowed: false,
        },
      ],
      operatorModalTimeouts: { ...SDK_OPERATOR_MODAL_TIMEOUT_DEFAULTS },
    },
    diagnostics: {
      status: "listening",
      bindHost: "127.0.0.1",
      bindPort: 17341,
      connectionCount: 0,
      authenticatedCount: 0,
      unauthenticatedCount: 0,
      pendingPairingCount: 0,
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
    addOriginDraft: "",
    errorKey: null,
    busy: false,
    onAddOriginDraftChange: vi.fn(),
    onAddOrigin: vi.fn(),
    onRefresh: vi.fn(),
    onRevokeClient: vi.fn(),
    onUnblockOrigin: vi.fn(),
    onBlacklistOrigin: vi.fn(),
    onRemoveAllowedOrigin: vi.fn(),
    onRenameAllowedOrigin: vi.fn(),
    onSetOriginMatrix: vi.fn(),
    onOperatorModalTimeoutsChange: vi.fn(),
    ...overrides,
  };
}

async function openTab(
  user: ReturnType<typeof userEvent.setup>,
  tab: "main" | "trusted" | "blocked",
): Promise<void> {
  await user.click(screen.getByTestId(`sdk-module-tab-${tab}`));
}

async function openTrustedSite(
  user: ReturnType<typeof userEvent.setup>,
  origin: string,
): Promise<HTMLElement> {
  const item = screen.getByTestId(`sdk-allowed-origin-${origin}`);
  const trigger = within(item).getByRole("button");
  await user.click(trigger);
  return item;
}

describe("SdkModuleSettingsCard", () => {
  it("renders three tabs and main panel content without secrets", () => {
    render(<SdkModuleSettingsCard {...createProps()} />);

    expect(screen.getByTestId("sdk-module-settings-card")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-module-section-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-module-tab-main")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-module-tab-trusted")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-module-tab-blocked")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-module-diagnostics")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-module-hide-toggle")).toBeDisabled();
    expect(screen.queryByTestId("sdk-module-blacklist")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sdk-module-attention")).not.toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(
      /sip-password|ocp-api-key|Bearer |privateKey|ADR-0013|session\.read\.redacted/i,
    );
  });

  it("shows empty blacklist copy on blocked tab when no blocked sites", async () => {
    const user = userEvent.setup();
    render(
      <SdkModuleSettingsCard
        {...createProps({
          settings: {
            originsManaged: true,
            origins: [
              {
                origin: "https://crm.example",
                state: "allowed",
                matrix: createDefaultSdkOriginCapabilityMatrix(),
                previouslyAllowed: true,
              },
            ],
            operatorModalTimeouts: { ...SDK_OPERATOR_MODAL_TIMEOUT_DEFAULTS },
          },
        })}
      />,
    );

    await openTab(user, "blocked");
    expect(screen.getByTestId("sdk-module-blacklist-empty")).toBeInTheDocument();
  });

  it("renders operator modal timeout selects on main tab", () => {
    render(<SdkModuleSettingsCard {...createProps()} />);
    expect(screen.getByTestId("sdk-module-timeouts")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-timeout-consent")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-timeout-origin-trust")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-timeout-pairing")).toBeInTheDocument();
  });

  it("confirms revoke for a paired client without exposing secrets", async () => {
    const user = userEvent.setup();
    const props = createProps();
    render(<SdkModuleSettingsCard {...props} />);

    await user.click(screen.getByTestId("sdk-module-revoke-cli_1"));
    await user.click(screen.getByTestId("sdk-module-revoke-confirm-cli_1"));
    expect(props.onRevokeClient).toHaveBeenCalledWith("cli_1");
  });

  it("supports accordion edit/save and destructive confirms for trusted sites", async () => {
    const user = userEvent.setup();
    const onRenameAllowedOrigin = vi.fn();
    const props = createProps({
      addOriginDraft: "https://new.example",
      onRenameAllowedOrigin,
    });
    render(<SdkModuleSettingsCard {...props} />);

    await openTab(user, "trusted");
    await user.click(screen.getByTestId("sdk-module-origin-add"));
    expect(props.onAddOrigin).toHaveBeenCalledTimes(1);

    await openTrustedSite(user, "https://crm.example");
    await user.click(screen.getByTestId("sdk-origin-edit-https://crm.example"));
    const editInput = screen.getByTestId("sdk-origin-edit-input-https://crm.example");
    await user.clear(editInput);
    await user.type(editInput, "https://crm-renamed.example");
    await user.click(screen.getByTestId("sdk-origin-edit-save-https://crm.example"));
    expect(onRenameAllowedOrigin).toHaveBeenCalledWith(
      "https://crm.example",
      "https://crm-renamed.example",
    );

    await user.click(screen.getByTestId("sdk-origin-remove-https://crm.example"));
    await user.click(screen.getByTestId("sdk-origin-remove-confirm-https://crm.example"));
    expect(props.onRemoveAllowedOrigin).toHaveBeenCalledWith("https://crm.example");

    await user.click(screen.getByTestId("sdk-origin-blacklist-https://crm.example"));
    await user.click(screen.getByTestId("sdk-origin-blacklist-confirm-https://crm.example"));
    expect(props.onBlacklistOrigin).toHaveBeenCalledWith("https://crm.example");
  });

  it("toggles permission chip inside expanded accordion", async () => {
    const user = userEvent.setup();
    const onSetOriginMatrix = vi.fn();
    render(<SdkModuleSettingsCard {...createProps({ onSetOriginMatrix })} />);

    await openTab(user, "trusted");
    await openTrustedSite(user, "https://crm.example");
    const toggle = screen.getByTestId("sdk-matrix-call.control-https://crm.example");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveTextContent("Allowed");
    await user.click(toggle);

    expect(onSetOriginMatrix).toHaveBeenCalled();
    const [, nextMatrix] = onSetOriginMatrix.mock.calls[0] as [
      string,
      { capabilities: Record<string, boolean> },
    ];
    expect(nextMatrix.capabilities["call.control"]).toBe(false);
  });

  it("keeps refresh next to gateway status on main tab", () => {
    render(<SdkModuleSettingsCard {...createProps()} />);
    const status = screen.getByTestId("sdk-module-diagnostics");
    expect(within(status).getByTestId("sdk-module-refresh")).toBeInTheDocument();
  });
});

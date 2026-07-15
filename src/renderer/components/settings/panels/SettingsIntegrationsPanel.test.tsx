// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSettingsAccountKey } from "@application/index.js";
import { initialOcpSessionProjection } from "@application/projections/integration/ocpSessionProjection.js";
import { OCP_INTEGRATION_DEFAULTS } from "@application/index.js";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { OcpModuleSettingsCard } from "./OcpModuleSettingsCard.js";
import { SettingsIntegrationsPanel } from "./SettingsIntegrationsPanel.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

function renderCard(
  overrides: Partial<Parameters<typeof OcpModuleSettingsCard>[0]> = {},
) {
  const props = {
    settings: { ...OCP_INTEGRATION_DEFAULTS, enabled: true, domain: "ocp.example" },
    session: initialOcpSessionProjection(),
    login: "agent-1",
    loginOptions: [],
    apiKeyDraft: "",
    apiKeyVisible: false,
    hasSavedApiKey: false,
    actionLoading: null,
    errorKey: null,
    onLoginChange: vi.fn(),
    onEnabledChange: vi.fn(),
    onDomainChange: vi.fn(),
    onAutoConnectChange: vi.fn(),
    onApiKeyDraftChange: vi.fn(),
    onApiKeyVisibleChange: vi.fn(),
    onSaveApiKey: vi.fn(),
    onDeleteApiKey: vi.fn(),
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
    ...overrides,
  };
  render(<OcpModuleSettingsCard {...props} />);
  return props;
}

describe("OcpModuleSettingsCard", () => {
  it("disables fields and connect when module is off", () => {
    renderCard({
      settings: { ...OCP_INTEGRATION_DEFAULTS, enabled: false },
      login: "agent-1",
    });
    expect(screen.getByTestId("ocp-module-domain-input")).toBeDisabled();
    expect(screen.getByTestId("ocp-module-api-key-input")).toBeDisabled();
    expect(screen.queryByTestId("ocp-module-connect")).not.toBeInTheDocument();
  });

  it("hides connect and shows hint when login is empty", () => {
    renderCard({
      settings: { ...OCP_INTEGRATION_DEFAULTS, enabled: true },
      login: "",
    });
    expect(screen.queryByTestId("ocp-module-connect")).not.toBeInTheDocument();
    expect(screen.getByTestId("ocp-module-login-required-hint")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-module-domain-input")).toBeDisabled();
  });

  it("calls connect when enabled with login", async () => {
    const user = userEvent.setup();
    const props = renderCard({ hasSavedApiKey: true, login: "agent-1" });
    await user.click(screen.getByTestId("ocp-module-connect"));
    expect(props.onConnect).toHaveBeenCalled();
  });

  it("renders datalist when saved profiles exist", () => {
    renderCard({
      loginOptions: [
        {
          login: "agent-a",
          accountKey: createSettingsAccountKey("agent-a@pbx.example"),
          displayName: "agent-a",
        },
      ],
    });
    expect(screen.getByTestId("ocp-module-login-datalist")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-module-login-input")).toHaveAttribute("list");
  });

  it("uses plain input without datalist when no saved profiles", () => {
    renderCard({ loginOptions: [] });
    expect(screen.queryByTestId("ocp-module-login-datalist")).not.toBeInTheDocument();
    expect(screen.getByTestId("ocp-module-login-input")).not.toHaveAttribute("list");
  });

  it("does not show auto SIP auth toggle", () => {
    renderCard();
    expect(screen.queryByTestId("ocp-module-auto-sip-auth-toggle")).not.toBeInTheDocument();
  });
});

describe("SettingsIntegrationsPanel", () => {
  it("renders OCP card", () => {
    render(
      <SettingsIntegrationsPanel
        ocp={{
          settings: { ...OCP_INTEGRATION_DEFAULTS },
          session: initialOcpSessionProjection(),
          login: "",
          loginOptions: [],
          apiKeyDraft: "",
          apiKeyVisible: false,
          hasSavedApiKey: false,
          actionLoading: null,
          errorKey: null,
          onLoginChange: vi.fn(),
          onEnabledChange: vi.fn(),
          onDomainChange: vi.fn(),
          onAutoConnectChange: vi.fn(),
          onApiKeyDraftChange: vi.fn(),
          onApiKeyVisibleChange: vi.fn(),
          onSaveApiKey: vi.fn(),
          onDeleteApiKey: vi.fn(),
          onConnect: vi.fn(),
          onDisconnect: vi.fn(),
        }}
      />,
    );
    expect(screen.getByTestId("ocp-module-settings-card")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-module-login-input")).toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    tokenDraft: "",
    tokenVisible: false,
    hasSavedToken: false,
    actionLoading: null,
    errorKey: null,
    onEnabledChange: vi.fn(),
    onDomainChange: vi.fn(),
    onAutoConnectChange: vi.fn(),
    onAutoSipAuthChange: vi.fn(),
    onTokenDraftChange: vi.fn(),
    onTokenVisibleChange: vi.fn(),
    onSaveToken: vi.fn(),
    onDeleteToken: vi.fn(),
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
    });

    expect(screen.getByTestId("ocp-module-status")).toHaveTextContent("Модуль выключен");
    expect(screen.getByTestId("ocp-module-enable-first-hint")).toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-connect")).toBeNull();
    expect(screen.getByTestId("ocp-module-domain-input")).toBeDisabled();
  });

  it("emits enable toggle and connect when enabled", async () => {
    const user = userEvent.setup();
    const props = renderCard();

    await user.click(screen.getByTestId("ocp-module-enabled-toggle"));
    expect(props.onEnabledChange).toHaveBeenCalledWith(false);

    await user.click(screen.getByTestId("ocp-module-connect"));
    expect(props.onConnect).toHaveBeenCalled();
  });

  it("emits token save/delete and shows disconnect when connected", async () => {
    const user = userEvent.setup();
    const props = renderCard({
      tokenDraft: "secret-token",
      hasSavedToken: true,
      session: {
        ...initialOcpSessionProjection(),
        connectionState: "authenticated",
        isAuthenticated: true,
      },
    });

    await user.click(screen.getByTestId("ocp-module-token-save"));
    expect(props.onSaveToken).toHaveBeenCalled();

    await user.click(screen.getByTestId("ocp-module-token-delete"));
    expect(props.onDeleteToken).toHaveBeenCalled();

    await user.click(screen.getByTestId("ocp-module-disconnect"));
    expect(props.onDisconnect).toHaveBeenCalled();
    expect(screen.getByTestId("ocp-module-status")).toHaveTextContent("Авторизовано");
  });

  it("shows domain required error key text", () => {
    renderCard({
      errorKey: "settings.integrations.ocp.error.domainRequired",
    });
    expect(screen.getByTestId("ocp-module-error")).toHaveTextContent("Укажите OCP Domain.");
  });
});

describe("SettingsIntegrationsPanel", () => {
  it("renders extensible panel with OCP card", () => {
    render(
      <SettingsIntegrationsPanel
        ocp={{
          settings: { ...OCP_INTEGRATION_DEFAULTS },
          session: initialOcpSessionProjection(),
          tokenDraft: "",
          tokenVisible: false,
          hasSavedToken: false,
          actionLoading: null,
          errorKey: null,
          onEnabledChange: vi.fn(),
          onDomainChange: vi.fn(),
          onAutoConnectChange: vi.fn(),
          onAutoSipAuthChange: vi.fn(),
          onTokenDraftChange: vi.fn(),
          onTokenVisibleChange: vi.fn(),
          onSaveToken: vi.fn(),
          onDeleteToken: vi.fn(),
          onConnect: vi.fn(),
          onDisconnect: vi.fn(),
        }}
      />,
    );

    expect(screen.getByTestId("settings-integrations-panel")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-module-settings-card")).toBeInTheDocument();
  });
});

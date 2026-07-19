// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OCP_INTEGRATION_DEFAULTS } from "@application/index.js";
import { setRendererLanguage } from "../../../i18n/index.js";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { OcpModuleSettingsCard } from "./OcpModuleSettingsCard.js";

beforeEach(() => {
  setupJsdomRadix();
  setRendererLanguage("ru");
});

afterEach(() => {
  cleanup();
  setRendererLanguage("ru");
});

const baseProps = {
  settings: {
    ...OCP_INTEGRATION_DEFAULTS,
    linked: true,
    enabled: true,
    domain: "ocp.example.com",
  },
  activeLoginLabel: "1001",
  errorKey: null,
  configEditable: true,
  onEnabledChange: vi.fn(),
  onDomainChange: vi.fn(),
  onAutoConnectChange: vi.fn(),
} as const;

describe("OcpModuleSettingsCard", () => {
  it("renders edit-only controls without Connect/Disconnect/API-key chrome", () => {
    render(<OcpModuleSettingsCard {...baseProps} />);

    expect(screen.getByTestId("ocp-module-active-login")).toHaveTextContent("1001");
    expect(screen.getByTestId("ocp-module-enabled-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-module-auto-connect-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-module-domain-input")).toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-api-key-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-api-key-save")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-api-key-delete")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-server-status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-authorization-status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-dual-status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-connect")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-disconnect")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-auth-retry")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-login-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-open-account-recovery")).not.toBeInTheDocument();
  });

  it("persists domain on blur for the active profile", () => {
    const onDomainChange = vi.fn();

    render(
      <OcpModuleSettingsCard {...baseProps} onDomainChange={onDomainChange} />,
    );

    const domain = screen.getByTestId("ocp-module-domain-input");
    fireEvent.change(domain, { target: { value: "new.ocp.example" } });
    fireEvent.blur(domain);
    expect(onDomainChange).toHaveBeenCalledWith("new.ocp.example");
  });
});

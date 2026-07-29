// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { SettingsIntegrationsPanel } from "./SettingsIntegrationsPanel.js";
import { settingsIntegrationsTestDefaults } from "./settingsIntegrationsTestDefaults.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

describe("SettingsIntegrationsPanel", () => {
  it("renders OCP Module card on integrations section", () => {
    render(
      <SettingsIntegrationsPanel
        sectionId="integrations"
        ocp={settingsIntegrationsTestDefaults.integrations.ocp}
        sdk={settingsIntegrationsTestDefaults.integrations.sdk}
        externalServices={settingsIntegrationsTestDefaults.integrations.externalServices}
      />,
    );

    expect(screen.getByTestId("ocp-module-settings-card")).toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-connect")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-disconnect")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sdk-module-settings-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("external-services-collections")).not.toBeInTheDocument();
  });

  it("renders External Services collections on integrations-external-services section", () => {
    render(
      <SettingsIntegrationsPanel
        sectionId="integrations-external-services"
        ocp={settingsIntegrationsTestDefaults.integrations.ocp}
        sdk={settingsIntegrationsTestDefaults.integrations.sdk}
        externalServices={settingsIntegrationsTestDefaults.integrations.externalServices}
      />,
    );

    expect(screen.getByTestId("external-services-collections")).toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-settings-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sdk-module-settings-card")).not.toBeInTheDocument();
  });

  it("renders SDK card with hide disabled on integrations-sdk section", () => {
    render(
      <SettingsIntegrationsPanel
        sectionId="integrations-sdk"
        ocp={settingsIntegrationsTestDefaults.integrations.ocp}
        sdk={settingsIntegrationsTestDefaults.integrations.sdk}
        externalServices={settingsIntegrationsTestDefaults.integrations.externalServices}
      />,
    );

    expect(screen.queryByTestId("ocp-module-settings-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("sdk-module-settings-card")).toBeInTheDocument();
    expect(screen.queryByTestId("sdk-module-hide-toggle")).toBeNull();
  });
});

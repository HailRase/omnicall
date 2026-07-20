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
  it("renders OCP and SDK Server cards with hide disabled", () => {
    render(
      <SettingsIntegrationsPanel
        ocp={settingsIntegrationsTestDefaults.integrations.ocp}
        sdk={settingsIntegrationsTestDefaults.integrations.sdk}
      />,
    );

    expect(screen.getByTestId("ocp-module-settings-card")).toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-connect")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-disconnect")).not.toBeInTheDocument();
    expect(screen.getByTestId("sdk-module-settings-card")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-module-hide-toggle")).toBeDisabled();
  });
});

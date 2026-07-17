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
  it("renders edit-only OCP module card", () => {
    render(
      <SettingsIntegrationsPanel ocp={settingsIntegrationsTestDefaults.integrations.ocp} />,
    );

    expect(screen.getByTestId("ocp-module-settings-card")).toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-connect")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ocp-module-disconnect")).not.toBeInTheDocument();
  });
});

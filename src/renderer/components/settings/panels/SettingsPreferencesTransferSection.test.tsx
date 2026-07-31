// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { SettingsPreferencesTransferSection } from "./SettingsPreferencesTransferSection.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

describe("SettingsPreferencesTransferSection", () => {
  it("invokes export and import callbacks", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    const onImport = vi.fn();

    render(
      <SettingsPreferencesTransferSection
        isBusy={false}
        statusMessage={null}
        onExport={onExport}
        onImport={onImport}
      />,
    );

    await user.click(screen.getByTestId("settings-preferences-export"));
    await user.click(screen.getByTestId("settings-preferences-import"));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("shows status message when provided", () => {
    render(
      <SettingsPreferencesTransferSection
        isBusy={false}
        statusMessage="Exported"
        onExport={() => undefined}
        onImport={() => undefined}
      />,
    );

    expect(screen.getByTestId("settings-preferences-transfer-status")).toHaveTextContent(
      "Exported",
    );
  });
});

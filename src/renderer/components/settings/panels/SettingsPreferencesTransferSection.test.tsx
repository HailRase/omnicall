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
        onExport={onExport}
        onImport={onImport}
      />,
    );

    await user.click(screen.getByTestId("settings-preferences-export"));
    await user.click(screen.getByTestId("settings-preferences-import"));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("does not render inline transfer status (notifications own outcomes)", () => {
    render(
      <SettingsPreferencesTransferSection
        isBusy={false}
        onExport={() => undefined}
        onImport={() => undefined}
      />,
    );

    expect(screen.queryByTestId("settings-preferences-transfer-status")).not.toBeInTheDocument();
  });
});

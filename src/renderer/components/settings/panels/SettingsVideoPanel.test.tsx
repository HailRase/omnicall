// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { SettingsVideoPanel } from "./SettingsVideoPanel.js";
import { settingsVideoTestDefaults } from "./settingsVideoTestDefaults.js";

afterEach(() => {
  cleanup();
});

describe("SettingsVideoPanel", () => {
  it("renders devices and view controls", () => {
    setupJsdomRadix();
    render(<SettingsVideoPanel {...settingsVideoTestDefaults} />);

    expect(screen.getByTestId("settings-video-panel")).toBeInTheDocument();
    expect(screen.getByTestId("settings-video-mic-select")).toBeInTheDocument();
    expect(screen.getByTestId("settings-video-camera-select")).toBeInTheDocument();
    expect(screen.getByTestId("settings-video-preview")).toBeInTheDocument();
    expect(screen.getByTestId("settings-video-default-view-select")).toBeInTheDocument();
    expect(screen.getByTestId("settings-video-auto-fullscreen-toggle")).toBeInTheDocument();
  });

  it("emits auto-fullscreen and refresh callbacks", async () => {
    setupJsdomRadix();
    const user = userEvent.setup();
    const onAutoFullscreenOnConferenceChange = vi.fn();
    const onRefreshDevices = vi.fn();

    render(
      <SettingsVideoPanel
        {...settingsVideoTestDefaults}
        onAutoFullscreenOnConferenceChange={onAutoFullscreenOnConferenceChange}
        onRefreshDevices={onRefreshDevices}
      />,
    );

    await user.click(screen.getByTestId("settings-video-auto-fullscreen-toggle"));
    expect(onAutoFullscreenOnConferenceChange).toHaveBeenCalledWith(true);

    await user.click(screen.getByTestId("settings-video-refresh-devices"));
    expect(onRefreshDevices).toHaveBeenCalledTimes(1);
  });

  it("disables conference substring when auto-fullscreen is off", () => {
    setupJsdomRadix();
    render(
      <SettingsVideoPanel
        {...settingsVideoTestDefaults}
        autoFullscreenOnConference={false}
      />,
    );

    expect(screen.getByTestId("settings-video-conference-substring")).toBeDisabled();
  });
});

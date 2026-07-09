// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { initialHeadsetConnectionProjection } from "@application/projections/headset/headsetConnectionProjection.js";
import { SettingsHeadsetPanel } from "./SettingsHeadsetPanel.js";

afterEach(() => {
  cleanup();
});

describe("SettingsHeadsetPanel", () => {
  it("emits enable toggle and connect action when integration is enabled", async () => {
    const user = userEvent.setup();
    const onHeadsetEnabledChange = vi.fn();
    const onConnectHeadset = vi.fn();

    render(
      <SettingsHeadsetPanel
        projection={{
          ...initialHeadsetConnectionProjection(),
          isSupported: true,
          isEnabled: true,
          connectionState: "disconnected",
        }}
        headsetEnabled
        headsetAutoReconnect
        onHeadsetEnabledChange={onHeadsetEnabledChange}
        onHeadsetAutoReconnectChange={vi.fn()}
        onConnectHeadset={onConnectHeadset}
        onDisconnectHeadset={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("settings-headset-enabled-toggle"));
    expect(onHeadsetEnabledChange).toHaveBeenCalledWith(false);

    await user.click(screen.getByTestId("settings-headset-connect"));
    expect(onConnectHeadset).toHaveBeenCalledTimes(1);
  });

  it("shows disabled status when integration is off", () => {
    render(
      <SettingsHeadsetPanel
        projection={initialHeadsetConnectionProjection()}
        headsetEnabled={false}
        headsetAutoReconnect
        onHeadsetEnabledChange={vi.fn()}
        onHeadsetAutoReconnectChange={vi.fn()}
        onConnectHeadset={vi.fn()}
        onDisconnectHeadset={vi.fn()}
      />,
    );

    expect(screen.getByTestId("settings-headset-status")).toHaveTextContent(
      "Интеграция выключена",
    );
    expect(screen.getByTestId("settings-headset-connect")).toBeDisabled();
  });
});

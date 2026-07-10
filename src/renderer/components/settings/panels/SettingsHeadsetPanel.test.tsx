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
        preferredDeviceId="1:2:Mock"
        grantedDevices={[{ id: "1:2:Mock", productName: "Mock Headset" }]}
        onHeadsetEnabledChange={onHeadsetEnabledChange}
        onHeadsetAutoReconnectChange={vi.fn()}
        onConnectHeadset={onConnectHeadset}
        onDisconnectHeadset={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("settings-headset-enabled-toggle"));
    expect(onHeadsetEnabledChange).toHaveBeenCalledWith(false);

    await user.click(screen.getByTestId("settings-headset-connect"));
    expect(onConnectHeadset).toHaveBeenCalledWith("1:2:Mock");
  });

  it("shows disabled status when integration is off", () => {
    render(
      <SettingsHeadsetPanel
        projection={initialHeadsetConnectionProjection()}
        headsetEnabled={false}
        headsetAutoReconnect
        preferredDeviceId={null}
        grantedDevices={[]}
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

  it("renders compact status block above toggles", () => {
    render(
      <SettingsHeadsetPanel
        projection={{
          ...initialHeadsetConnectionProjection(),
          isSupported: true,
          isEnabled: true,
          connectionState: "connected",
          deviceId: "1:2:Mock",
          deviceLabel: "Mock Headset",
        }}
        headsetEnabled
        headsetAutoReconnect
        preferredDeviceId="1:2:Mock"
        grantedDevices={[{ id: "1:2:Mock", productName: "Mock Headset" }]}
        onHeadsetEnabledChange={vi.fn()}
        onHeadsetAutoReconnectChange={vi.fn()}
        onConnectHeadset={vi.fn()}
        onDisconnectHeadset={vi.fn()}
      />,
    );

    expect(screen.getByTestId("settings-headset-status")).toHaveTextContent("Подключена");
    expect(screen.getByTestId("settings-headset-device-label")).toHaveTextContent("Mock Headset");
    expect(screen.getByTestId("settings-headset-device-select")).toBeDisabled();
    expect(screen.getByTestId("settings-headset-disconnect")).toBeEnabled();
    expect(screen.getByTestId("settings-headset-enabled-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("settings-headset-auto-reconnect-toggle")).toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { SettingsNotificationAppearancePanel } from "./SettingsNotificationAppearancePanel.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

const baseProps = {
  notificationPlacement: "bottom-right" as const,
  onNotificationPlacementChange: vi.fn(),
  notificationStacking: "stacked" as const,
  onNotificationStackingChange: vi.fn(),
  notificationDurationMs: 4200,
  onNotificationDurationMsChange: vi.fn(),
  notificationMaxVisible: 3,
  onNotificationMaxVisibleChange: vi.fn(),
};

describe("SettingsNotificationAppearancePanel", () => {
  it("emits placement, stacking, duration, and maxVisible changes", async () => {
    const user = userEvent.setup();
    const onNotificationPlacementChange = vi.fn();
    const onNotificationStackingChange = vi.fn();
    const onNotificationDurationMsChange = vi.fn();
    const onNotificationMaxVisibleChange = vi.fn();

    render(
      <SettingsNotificationAppearancePanel
        {...baseProps}
        onNotificationPlacementChange={onNotificationPlacementChange}
        onNotificationStackingChange={onNotificationStackingChange}
        onNotificationDurationMsChange={onNotificationDurationMsChange}
        onNotificationMaxVisibleChange={onNotificationMaxVisibleChange}
      />,
    );

    expect(screen.getByTestId("settings-notification-appearance")).toBeInTheDocument();
    expect(screen.getByTestId("settings-notification-placement-control")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-notification-placement-top-left"));
    await user.click(screen.getByTestId("settings-notification-stacking-single"));
    fireEvent.change(screen.getByTestId("settings-notification-duration"), {
      target: { value: "5000" },
    });
    fireEvent.change(screen.getByTestId("settings-notification-max-visible"), {
      target: { value: "4" },
    });

    expect(onNotificationPlacementChange).toHaveBeenCalledWith("top-left");
    expect(onNotificationStackingChange).toHaveBeenCalledWith("single");
    expect(onNotificationDurationMsChange).toHaveBeenCalledWith(5000);
    expect(onNotificationMaxVisibleChange).toHaveBeenCalledWith(4);
  });
});

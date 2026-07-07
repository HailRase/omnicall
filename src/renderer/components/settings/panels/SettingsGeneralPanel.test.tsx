// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { SettingsGeneralPanel } from "./SettingsGeneralPanel.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

const baseProps = {
  language: "ru" as const,
  onLanguageChange: vi.fn(),
  theme: "light" as const,
  onThemeChange: vi.fn(),
  notificationPlacement: "bottom-right" as const,
  onNotificationPlacementChange: vi.fn(),
  notificationStacking: "stacked" as const,
  onNotificationStackingChange: vi.fn(),
  notificationDurationMs: 4200,
  onNotificationDurationMsChange: vi.fn(),
  notificationClosable: true,
  onNotificationClosableChange: vi.fn(),
  notificationMaxVisible: 3,
  onNotificationMaxVisibleChange: vi.fn(),
  currentVersion: "0.0.1",
  latestVersion: undefined,
  updateStatusMessage: "Нажмите «Проверить обновления», чтобы узнать о новой версии.",
  canCheckForUpdates: true,
  canOpenDownloadPage: false,
  isCheckingUpdates: false,
  onCheckForUpdates: vi.fn(),
  onOpenDownloadPage: vi.fn(),
};

describe("SettingsGeneralPanel", () => {
  it("renders theme control at the top and emits theme changes", async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();

    render(
      <SettingsGeneralPanel
        {...baseProps}
        theme="light"
        onThemeChange={onThemeChange}
      />,
    );

    expect(screen.getByTestId("settings-theme-control")).toBeInTheDocument();
    expect(screen.getByTestId("settings-theme-light")).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByTestId("settings-theme-dark"));
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  it("renders language selector and emits language changes", async () => {
    const user = userEvent.setup();
    const onLanguageChange = vi.fn();

    render(
      <SettingsGeneralPanel
        {...baseProps}
        onLanguageChange={onLanguageChange}
      />,
    );

    await user.click(screen.getByTestId("settings-language-select"));
    await user.click(await screen.findByRole("option", { name: "English" }));
    expect(onLanguageChange).toHaveBeenCalledWith("en");
  });

  it("renders about section and emits update actions", async () => {
    const user = userEvent.setup();
    const onCheckForUpdates = vi.fn();

    render(
      <SettingsGeneralPanel
        {...baseProps}
        onCheckForUpdates={onCheckForUpdates}
      />,
    );

    expect(screen.getByTestId("settings-current-version")).toHaveTextContent("0.0.1");
    await user.click(screen.getByTestId("settings-check-updates"));
    expect(onCheckForUpdates).toHaveBeenCalled();
  });

  it("does not render SIP recovery controls", () => {
    render(<SettingsGeneralPanel {...baseProps} />);

    expect(screen.queryByTestId("settings-sip-auto-reregister-toggle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-sip-auto-reconnect-toggle")).not.toBeInTheDocument();
  });

  it("emits notification settings changes", async () => {
    const user = userEvent.setup();
    const onNotificationPlacementChange = vi.fn();
    const onNotificationStackingChange = vi.fn();
    const onNotificationDurationMsChange = vi.fn();
    const onNotificationMaxVisibleChange = vi.fn();
    const onNotificationClosableChange = vi.fn();

    render(
      <SettingsGeneralPanel
        {...baseProps}
        onNotificationPlacementChange={onNotificationPlacementChange}
        onNotificationStackingChange={onNotificationStackingChange}
        onNotificationDurationMsChange={onNotificationDurationMsChange}
        onNotificationMaxVisibleChange={onNotificationMaxVisibleChange}
        onNotificationClosableChange={onNotificationClosableChange}
      />,
    );

    await user.click(screen.getByTestId("settings-notification-placement-top-left"));
    await user.click(screen.getByTestId("settings-notification-stacking-single"));
    fireEvent.change(screen.getByTestId("settings-notification-duration"), {
      target: { value: "5000" },
    });
    fireEvent.change(screen.getByTestId("settings-notification-max-visible"), {
      target: { value: "4" },
    });
    await user.click(screen.getByTestId("settings-notification-closable"));

    expect(onNotificationPlacementChange).toHaveBeenCalledWith("top-left");
    expect(onNotificationStackingChange).toHaveBeenCalledWith("single");
    expect(onNotificationDurationMsChange).toHaveBeenCalledWith(5000);
    expect(onNotificationMaxVisibleChange).toHaveBeenCalledWith(4);
    expect(onNotificationClosableChange).toHaveBeenCalledWith(false);
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
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

  it("does not render notification settings or relocation CTA", () => {
    render(<SettingsGeneralPanel {...baseProps} />);

    expect(screen.queryByTestId("settings-notification-placement-control")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-notification-stacking-control")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-notification-duration")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-notification-max-visible")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-general-notifications-relocated-hint"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-general-open-notification-appearance"),
    ).not.toBeInTheDocument();
  });
});

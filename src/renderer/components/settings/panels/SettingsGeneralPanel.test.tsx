// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsGeneralPanel } from "./SettingsGeneralPanel.js";

afterEach(() => {
  cleanup();
});

const baseProps = {
  theme: "light" as const,
  onThemeChange: vi.fn(),
  sipAutoReregisterEnabled: true,
  onSipAutoReregisterChange: vi.fn(),
  sipReregisterIntervalSec: 5,
  onSipReregisterIntervalChange: vi.fn(),
};

describe("SettingsGeneralPanel", () => {
  it("disables interval input when auto-reregister is off", () => {
    render(
      <SettingsGeneralPanel
        {...baseProps}
        sipAutoReregisterEnabled={false}
      />,
    );

    expect(screen.getByTestId("settings-sip-reregister-interval")).toBeDisabled();
  });

  it("emits toggle and interval changes", async () => {
    const user = userEvent.setup();
    const onSipAutoReregisterChange = vi.fn();
    const onSipReregisterIntervalChange = vi.fn();

    render(
      <SettingsGeneralPanel
        {...baseProps}
        onSipAutoReregisterChange={onSipAutoReregisterChange}
        onSipReregisterIntervalChange={onSipReregisterIntervalChange}
      />,
    );

    await user.click(screen.getByTestId("settings-sip-auto-reregister-toggle"));
    expect(onSipAutoReregisterChange).toHaveBeenCalledWith(false);

    const interval = screen.getByTestId("settings-sip-reregister-interval");
    await user.clear(interval);
    await user.type(interval, "10");
    expect(onSipReregisterIntervalChange).toHaveBeenCalled();
  });

  it("shows recovery hint with minimum interval", () => {
    render(<SettingsGeneralPanel {...baseProps} />);

    expect(screen.getByTestId("settings-sip-recovery-hint")).toHaveTextContent(/минимум/i);
  });

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
});

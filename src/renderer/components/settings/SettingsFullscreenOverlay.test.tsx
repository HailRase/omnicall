// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsFullscreenOverlay } from "./SettingsFullscreenOverlay.js";
import { SettingsPanel } from "./SettingsPanel.js";

const panelProps = {
  activeSection: "general" as const,
  sidebarExpanded: false,
  onSectionChange: vi.fn(),
  onSidebarExpandedChange: vi.fn(),
  multiSessionsEnabled: true,
  onMultiSessionsChange: vi.fn(),
  sipAutoReregisterEnabled: true,
  onSipAutoReregisterChange: vi.fn(),
  sipReregisterIntervalSec: 5,
  onSipReregisterIntervalChange: vi.fn(),
  account: {
    form: { username: "", password: "", domain: "", server: "" },
    submitting: false,
    error: null,
    disabled: false,
    authorizeDisabledReason: null,
    logoutDisabledReason: "Заполните поля и нажмите «Авторизоваться»",
    onFieldChange: vi.fn(),
    onSubmit: vi.fn(),
    onLogout: vi.fn(),
  },
};

describe("SettingsFullscreenOverlay", () => {
  it("renders when open and closes on button click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(
      <SettingsFullscreenOverlay open={false} onClose={onClose}>
        <SettingsPanel {...panelProps} />
      </SettingsFullscreenOverlay>,
    );

    expect(screen.queryByTestId("settings-overlay")).not.toBeInTheDocument();

    rerender(
      <SettingsFullscreenOverlay open onClose={onClose}>
        <SettingsPanel {...panelProps} />
      </SettingsFullscreenOverlay>,
    );

    expect(screen.getByTestId("settings-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overlay-body")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-overlay-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

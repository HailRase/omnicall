// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsOverlay } from "./SettingsOverlay.js";

describe("SettingsOverlay", () => {
  it("reflects multiSessionsEnabled and emits toggle changes", async () => {
    const user = userEvent.setup();
    const onMultiSessionsChange = vi.fn();

    const { rerender } = render(
      <SettingsOverlay
        multiSessionsEnabled
        onMultiSessionsChange={onMultiSessionsChange}
        sipAutoReregisterEnabled
        onSipAutoReregisterChange={() => undefined}
        sipReregisterIntervalSec={5}
        onSipReregisterIntervalChange={() => undefined}
      />,
    );

    const toggle = screen.getByTestId("settings-multi-sessions-toggle");
    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(onMultiSessionsChange).toHaveBeenCalledWith(false);

    rerender(
      <SettingsOverlay
        multiSessionsEnabled={false}
        onMultiSessionsChange={onMultiSessionsChange}
        sipAutoReregisterEnabled
        onSipAutoReregisterChange={() => undefined}
        sipReregisterIntervalSec={5}
        onSipReregisterIntervalChange={() => undefined}
      />,
    );
    expect(screen.getByTestId("settings-multi-sessions-toggle")).not.toBeChecked();
  });

  it("shows update error when provided", () => {
    render(
      <SettingsOverlay
        multiSessionsEnabled
        onMultiSessionsChange={() => undefined}
        sipAutoReregisterEnabled
        onSipAutoReregisterChange={() => undefined}
        sipReregisterIntervalSec={5}
        onSipReregisterIntervalChange={() => undefined}
        updateError="Repository unavailable"
      />,
    );

    expect(screen.getByTestId("settings-update-error")).toHaveTextContent(
      "Repository unavailable",
    );
  });
});

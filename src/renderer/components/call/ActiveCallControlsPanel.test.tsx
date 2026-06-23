// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActiveCallControlsPanel } from "./ActiveCallControlsPanel.js";

afterEach(() => {
  cleanup();
});

describe("ActiveCallControlsPanel", () => {
  it("renders enabled controls for active call", () => {
    const onHold = vi.fn();
    renderPanel({ onHold });

    const holdButton = screen.getByTestId("control-hold");
    expect(holdButton).toBeEnabled();
    fireEvent.click(holdButton);
    expect(onHold).toHaveBeenCalledTimes(1);
  });

  it("shows disabled reason from projection", () => {
    renderPanel({
      holdDisabledReason: "hold_requires_active",
      resumeDisabledReason: null,
    });

    expect(screen.getByTestId("control-hold")).toBeDisabled();
    expect(screen.getByTestId("control-disabled-reason")).toHaveTextContent(
      "Hold requires active call",
    );
  });

  it("shows error banner and retry action", () => {
    const onRetry = vi.fn();
    renderPanel({
      lastOperationError: {
        operation: "hold",
        message: "Hold failed for call-1",
      },
      onRetry,
    });

    expect(screen.getByTestId("active-call-control-error")).toHaveTextContent(
      "Hold failed: Hold failed for call-1",
    );
    fireEvent.click(screen.getByTestId("control-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("activates enabled control with Enter and Space", async () => {
    const user = userEvent.setup();
    const onHold = vi.fn();
    renderPanel({ onHold });

    const holdButton = screen.getByTestId("control-hold");
    holdButton.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onHold).toHaveBeenCalledTimes(2);
  });
});

type ActiveCallControlsOverrides = Partial<
  Parameters<typeof ActiveCallControlsPanel>[0]
>;

function renderPanel(overrides: ActiveCallControlsOverrides = {}): void {
  const props: Parameters<typeof ActiveCallControlsPanel>[0] = {
    visible: true,
    muted: false,
    holdDisabledReason: null,
    resumeDisabledReason: "resume_requires_held",
    muteDisabledReason: null,
    unmuteDisabledReason: "not_muted",
    hangupDisabledReason: null,
    lastOperationError: null,
    onHold: vi.fn(),
    onResume: vi.fn(),
    onMute: vi.fn(),
    onUnmute: vi.fn(),
    onHangup: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };

  render(<ActiveCallControlsPanel {...props} />);
}

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CallLineCardViewModel } from "@application/index.js";
import { ActiveCallQuickBar } from "./ActiveCallQuickBar.js";

afterEach(() => {
  cleanup();
});

const activeLine: CallLineCardViewModel = {
  callId: "call-1",
  role: "primary",
  state: "Active",
  muted: false,
  isActiveUnheld: true,
  displayName: "+12025550100",
  statusLabel: "На линии",
  durationStartedAt: Date.now(),
  queueLabelState: "hidden",
  queueName: null,
  primaryAction: "hangup",
  showIconRow: true,
  resumeDisabledReason: null,
  hangupDisabledReason: null,
  holdDisabledReason: null,
  muteDisabledReason: null,
  unmuteDisabledReason: null,
  transferDisabledReason: null,
};

describe("ActiveCallQuickBar", () => {
  it("renders compact controls for active unheld line", () => {
    render(
      <ActiveCallQuickBar
        line={activeLine}
        lastOperationError={null}
        onHold={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onHangup={vi.fn()}
        onTransfer={vi.fn()}
        onRetryOperation={vi.fn()}
      />,
    );

    expect(screen.getByTestId("active-call-quick-bar")).toBeInTheDocument();
    expect(screen.getByTestId("control-hold-line-call-1")).toBeEnabled();
    expect(screen.getByTestId("control-hangup-line-call-1")).toBeEnabled();
  });

  it("returns null when no active line", () => {
    const { container } = render(
      <ActiveCallQuickBar
        line={null}
        lastOperationError={null}
        onHold={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onHangup={vi.fn()}
        onTransfer={vi.fn()}
        onRetryOperation={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("forwards hangup action", () => {
    const onHangup = vi.fn();
    render(
      <ActiveCallQuickBar
        line={activeLine}
        lastOperationError={null}
        onHold={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onHangup={onHangup}
        onTransfer={vi.fn()}
        onRetryOperation={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("control-hangup-line-call-1"));
    expect(onHangup).toHaveBeenCalledWith("call-1");
  });
});

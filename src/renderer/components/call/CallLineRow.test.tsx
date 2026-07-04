// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CallLineCardViewModel } from "@application/index.js";
import { CallLineRow } from "./CallLineRow.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const baseLine: CallLineCardViewModel = {
  callId: "call-1",
  role: "primary",
  state: "Active",
  muted: false,
  isActiveUnheld: true,
  displayName: "+12025550100",
  statusLabel: "call.line.status.active",
  durationStartedAt: Date.now() - 65_000,
  queueLabelState: "hidden",
  queueName: null,
  primaryAction: "hangup",
  showIconRow: true,
  showLocalHoldBadge: false,
  showRemoteHoldBadge: false,
  resumeDisabledReason: null,
  hangupDisabledReason: null,
  holdDisabledReason: null,
  muteDisabledReason: null,
  unmuteDisabledReason: null,
  transferDisabledReason: null,
};

describe("CallLineRow", () => {
  it("renders active line with icon row and hangup primary", () => {
    render(
      <CallLineRow
        line={baseLine}
        lastOperationError={null}
        onResume={vi.fn()}
        onHangup={vi.fn()}
        onHold={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onTransfer={vi.fn()}
        onAnswer={vi.fn()}
        onRetryOperation={vi.fn()}
      />,
    );

    expect(screen.getByTestId("call-line-call-1")).toBeInTheDocument();
    expect(screen.getByText("+12025550100")).toBeInTheDocument();
    expect(screen.getByTestId("control-hold-line-call-1")).toBeEnabled();
    expect(screen.getByTestId("control-hangup-line-call-1")).toBeEnabled();
    expect(screen.getByTestId("call-line-duration-call-1")).toHaveTextContent("1:05");
  });

  it("shows resume primary and hides icon row when held", () => {
    const onResume = vi.fn();
    render(
      <CallLineRow
        line={{
          ...baseLine,
          state: "Held",
          statusLabel: "call.line.status.held",
          primaryAction: "resume",
          showIconRow: false,
          showLocalHoldBadge: true,
          showRemoteHoldBadge: false,
          isActiveUnheld: false,
        }}
        lastOperationError={null}
        onResume={onResume}
        onHangup={vi.fn()}
        onHold={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onTransfer={vi.fn()}
        onAnswer={vi.fn()}
        onRetryOperation={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("control-hold-line-call-1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("control-resume-line-call-1"));
    expect(onResume).toHaveBeenCalledWith("call-1");
  });

  it("shows operation error banner for active unheld line", () => {
    const onRetryOperation = vi.fn();
    render(
      <CallLineRow
        line={baseLine}
        lastOperationError={{ operation: "hold", message: "network error" }}
        onResume={vi.fn()}
        onHangup={vi.fn()}
        onHold={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onTransfer={vi.fn()}
        onAnswer={vi.fn()}
        onRetryOperation={onRetryOperation}
      />,
    );

    expect(screen.getByTestId("call-line-error-call-1")).toHaveTextContent("network error");
    fireEvent.click(screen.getByTestId("control-retry-line-call-1"));
    expect(onRetryOperation).toHaveBeenCalledTimes(1);
  });
});

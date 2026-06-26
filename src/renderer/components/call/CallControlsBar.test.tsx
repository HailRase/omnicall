// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CallLineCardViewModel } from "@application/index.js";
import { CallControlsBar } from "./CallControlsBar.js";

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

describe("CallControlsBar", () => {
  it("renders labeled controls for active line", () => {
    render(
      <CallControlsBar
        line={activeLine}
        lastOperationError={null}
        onHold={vi.fn()}
        onResume={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onHangup={vi.fn()}
        onTransfer={vi.fn()}
        onShowDtmf={vi.fn()}
        onRetryOperation={vi.fn()}
      />,
    );

    expect(screen.getByTestId("call-controls-bar")).toBeInTheDocument();
    expect(screen.getByText("Удержание")).toBeInTheDocument();
    expect(screen.getByText("Тоновый набор")).toBeInTheDocument();
    expect(screen.getByText("Завершить")).toBeInTheDocument();
  });

  it("invokes DTMF callback", () => {
    const onShowDtmf = vi.fn();
    render(
      <CallControlsBar
        line={activeLine}
        lastOperationError={null}
        onHold={vi.fn()}
        onResume={vi.fn()}
        onMute={vi.fn()}
        onUnmute={vi.fn()}
        onHangup={vi.fn()}
        onTransfer={vi.fn()}
        onShowDtmf={onShowDtmf}
        onRetryOperation={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("control-show-dtmf"));
    expect(onShowDtmf).toHaveBeenCalledTimes(1);
  });
});

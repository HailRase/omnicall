// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TransferPanel } from "./TransferPanel.js";

afterEach(() => {
  cleanup();
});

describe("TransferPanel", () => {
  it("renders transfer controls with required test IDs", () => {
    renderPanel();

    expect(screen.getByTestId("transfer-panel")).toBeInTheDocument();
    expect(screen.getByTestId("transfer-target-input")).toBeInTheDocument();
    expect(screen.getByTestId("control-blind-transfer")).toBeInTheDocument();
    expect(screen.getByTestId("control-start-consultation")).toBeInTheDocument();
    expect(screen.getByTestId("control-attended-transfer")).toBeInTheDocument();
    expect(screen.getByTestId("control-cancel-transfer")).toBeInTheDocument();
  });

  it("shows failure banner with alert role", () => {
    renderPanel({ failureMessage: "Transfer failed: REFER rejected" });

    const banner = screen.getByTestId("transfer-failure-banner");
    expect(banner).toHaveAttribute("role", "alert");
    expect(banner).toHaveTextContent("Transfer failed: REFER rejected");
  });

  it("shows consultation failure copy", () => {
    renderPanel({ failureMessage: "Consultation failed: busy" });

    expect(screen.getByTestId("transfer-failure-banner")).toHaveTextContent(
      "Consultation failed: busy",
    );
  });

  it("does not show failure banner when failure message is null", () => {
    renderPanel({ failureMessage: null });

    expect(screen.queryByTestId("transfer-failure-banner")).not.toBeInTheDocument();
  });

  it("surfaces disabled reason via transfer-disabled-reason", () => {
    renderPanel({
      blindTransferDisabledReason: "transfer_in_progress",
      startConsultationDisabledReason: null,
      attendedTransferDisabledReason: null,
    });

    const reason = screen.getByTestId("transfer-disabled-reason");
    expect(reason).toHaveAttribute("role", "status");
    expect(reason).toHaveTextContent("Transfer in progress");
  });

  it("disables controls when projection supplies disabled reasons", () => {
    renderPanel({
      blindTransferDisabledReason: "invalid_target",
      startConsultationDisabledReason: "second_session_disabled",
      attendedTransferDisabledReason: "consultation_not_active",
      cancelTransferDisabledReason: "transfer_in_progress",
    });

    expect(screen.getByTestId("control-blind-transfer")).toBeDisabled();
    expect(screen.getByTestId("control-start-consultation")).toBeDisabled();
    expect(screen.getByTestId("control-attended-transfer")).toBeDisabled();
    expect(screen.getByTestId("control-cancel-transfer")).toBeDisabled();
  });

  it("shows in-progress indicator with status role", () => {
    renderPanel({ transferInProgress: true });

    const indicator = screen.getByTestId("transfer-in-progress-indicator");
    expect(indicator).toHaveAttribute("role", "status");
  });

  it("invokes blind transfer callback when enabled", () => {
    const onBlindTransfer = vi.fn();
    renderPanel({ onBlindTransfer });

    fireEvent.click(screen.getByTestId("control-blind-transfer"));
    expect(onBlindTransfer).toHaveBeenCalledTimes(1);
  });

  it("activates enabled blind transfer with Enter and Space", async () => {
    const user = userEvent.setup();
    const onBlindTransfer = vi.fn();
    renderPanel({ onBlindTransfer });

    const button = screen.getByTestId("control-blind-transfer");
    button.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onBlindTransfer).toHaveBeenCalledTimes(2);
  });
});

type TransferPanelOverrides = Partial<Parameters<typeof TransferPanel>[0]>;

function renderPanel(overrides: TransferPanelOverrides = {}): void {
  const props: Parameters<typeof TransferPanel>[0] = {
    visible: true,
    targetNumber: "+12025550100",
    blindTransferDisabledReason: null,
    startConsultationDisabledReason: "second_session_disabled",
    attendedTransferDisabledReason: "consultation_not_active",
    cancelTransferDisabledReason: null,
    transferInProgress: false,
    failureMessage: null,
    lines: [
      { callId: "call-1", role: "source", state: "Held" },
      { callId: "call-2", role: "consultation", state: "Active" },
    ],
    onTargetChange: vi.fn(),
    onBlindTransfer: vi.fn(),
    onStartConsultation: vi.fn(),
    onAttendedTransfer: vi.fn(),
    onCancelTransfer: vi.fn(),
    ...overrides,
  };

  render(<TransferPanel {...props} />);
  expect(screen.getByTestId("multi-line-call-list")).toBeInTheDocument();
  expect(screen.getByTestId("call-line-call-1")).toBeInTheDocument();
}

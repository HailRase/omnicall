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
    expect(screen.getByTestId("transfer-next-step")).toBeInTheDocument();
    expect(screen.getByTestId("control-cancel-transfer")).toBeInTheDocument();
  });

  it("shows action buttons from step 2 after clicking next", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByTestId("transfer-next-step"));

    expect(screen.getByTestId("control-blind-transfer")).toBeInTheDocument();
    expect(screen.getByTestId("control-start-consultation")).toBeInTheDocument();
    expect(screen.queryByTestId("control-attended-transfer")).not.toBeInTheDocument();
  });

  it("shows failure banner with alert role", () => {
    renderPanel({
      failureTitle: "Ошибка перевода",
      failureMessage: "REFER rejected",
    });

    const banner = screen.getByTestId("transfer-failure-banner");
    expect(banner).toHaveAttribute("role", "alert");
    expect(banner).toHaveTextContent("REFER rejected");
    expect(banner).toHaveTextContent("Ошибка перевода");
  });

  it("shows consultation failure copy", () => {
    renderPanel({
      failureTitle: "Ошибка консультации",
      failureMessage: "busy",
    });

    expect(screen.getByTestId("transfer-failure-banner")).toHaveTextContent("busy");
    expect(screen.getByTestId("transfer-failure-banner")).toHaveTextContent(
      "Ошибка консультации",
    );
  });

  it("does not show relationship_invalid on step 1 with valid target", () => {
    renderPanel({
      targetNumber: "4",
      attendedTransferDisabledReason: "relationship_invalid",
      startConsultationDisabledReason: null,
      blindTransferDisabledReason: null,
    });

    expect(screen.queryByTestId("transfer-disabled-reason")).not.toBeInTheDocument();
  });

  it("does not show failure banner when failure message is null", () => {
    renderPanel({ failureMessage: null });

    expect(screen.queryByTestId("transfer-failure-banner")).not.toBeInTheDocument();
  });

  it("surfaces disabled reason via transfer-disabled-reason", async () => {
    const user = userEvent.setup();
    renderPanel({
      blindTransferDisabledReason: "transfer_in_progress",
      startConsultationDisabledReason: null,
      attendedTransferDisabledReason: null,
    });

    await user.click(screen.getByTestId("transfer-next-step"));

    const reason = screen.getByTestId("transfer-disabled-reason");
    expect(reason).toHaveAttribute("role", "status");
    expect(reason).toHaveTextContent("Перевод выполняется");
  });

  it("disables controls when projection supplies disabled reasons", () => {
    renderPanel({
      blindTransferDisabledReason: "invalid_target",
      startConsultationDisabledReason: "second_session_disabled",
      attendedTransferDisabledReason: "consultation_not_active",
      cancelTransferDisabledReason: "transfer_in_progress",
    });

    fireEvent.click(screen.getByTestId("transfer-next-step"));

    expect(screen.getByTestId("control-blind-transfer")).toBeDisabled();
    expect(screen.getByTestId("control-start-consultation")).toBeDisabled();
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

    fireEvent.click(screen.getByTestId("transfer-next-step"));
    fireEvent.click(screen.getByTestId("control-blind-transfer"));
    expect(onBlindTransfer).toHaveBeenCalledTimes(1);
  });

  it("activates enabled blind transfer with Enter", async () => {
    const user = userEvent.setup();
    const onBlindTransfer = vi.fn();
    renderPanel({ onBlindTransfer });

    await user.click(screen.getByTestId("transfer-next-step"));
    const button = screen.getByTestId("control-blind-transfer");
    button.focus();
    await user.keyboard("{Enter}");

    expect(onBlindTransfer).toHaveBeenCalledTimes(1);
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
    failureTitle: null,
    failureMessage: null,
    lines: [
      {
        callId: "call-1",
        role: "source",
        state: "Held",
        muted: false,
        displayLabel: "+12025550101",
        activeSinceMs: null,
        isRemoteHold: false,
        dtmfHistory: "",
        lastDtmfTone: null,
      },
    ],
    onTargetChange: vi.fn(),
    onBlindTransfer: vi.fn(),
    onStartConsultation: vi.fn(),
    onAttendedTransfer: vi.fn(),
    onCancelTransfer: vi.fn(),
    ...overrides,
  };

  render(<TransferPanel {...props} />);
  expect(screen.getByTestId("transfer-source-line")).toBeInTheDocument();
}

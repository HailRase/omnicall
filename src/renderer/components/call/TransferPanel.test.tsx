// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CallLine } from "@application/index.js";
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

  it("does not show relationship_invalid on step 1 with valid target", () => {
    renderPanel({
      targetNumber: "4",
      attendedTransferDisabledReason: "relationship_invalid",
      startConsultationDisabledReason: null,
      blindTransferDisabledReason: null,
    });

    expect(screen.queryByTestId("transfer-disabled-reason")).not.toBeInTheDocument();
  });

  it("shows progress indicator without duplicate disabled reason", () => {
    renderPanel({
      transferInProgress: true,
      blindTransferDisabledReason: "transfer_in_progress",
      attendedTransferDisabledReason: "transfer_in_progress",
      cancelTransferDisabledReason: "transfer_in_progress",
    });

    expect(screen.getByTestId("transfer-in-progress-indicator")).toHaveTextContent(
      "Перевод выполняется",
    );
    expect(screen.queryByTestId("transfer-disabled-reason")).not.toBeInTheDocument();
  });

  it("does not show blind invalid_target on consultation step when target cleared", () => {
    renderPanel({
      targetNumber: "",
      blindTransferDisabledReason: "invalid_target",
      attendedTransferDisabledReason: null,
      startConsultationDisabledReason: null,
      lines: [
        {
          callId: "call-1",
          role: "source",
          state: "Held",
          muted: false,
          displayLabel: "+12025550101",
          remoteNumber: "+12025550101",
          activeSinceMs: null,
          isRemoteHold: false,
          dtmfHistory: "",
          lastDtmfTone: null,
        },
        {
          callId: "call-2",
          role: "consultation",
          state: "Active",
          muted: false,
          displayLabel: "+12025550102",
          remoteNumber: "+12025550102",
          activeSinceMs: 1_000,
          isRemoteHold: false,
          dtmfHistory: "",
          lastDtmfTone: null,
        },
      ],
    });

    expect(screen.queryByTestId("transfer-disabled-reason")).not.toBeInTheDocument();
  });

  it("surfaces disabled reason via transfer-disabled-reason", async () => {
    const user = userEvent.setup();
    renderPanel({
      blindTransferDisabledReason: "invalid_target",
      startConsultationDisabledReason: null,
      attendedTransferDisabledReason: null,
    });

    await user.click(screen.getByTestId("transfer-next-step"));

    const reason = screen.getByTestId("transfer-disabled-reason");
    expect(reason).toHaveAttribute("role", "status");
    expect(reason).toHaveTextContent("Некорректный номер перевода");
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

  it("does not render footer cancel duplicate on step 1", () => {
    renderPanel();

    expect(screen.queryByTestId("transfer-footer-cancel")).not.toBeInTheDocument();
    expect(screen.getByTestId("control-cancel-transfer")).toBeInTheDocument();
  });

  it("shows complete transfer action when consultation is active", () => {
    renderPanel({
      startConsultationDisabledReason: null,
      attendedTransferDisabledReason: null,
      lines: [
        {
          callId: "call-1",
          role: "source",
          state: "Held",
          muted: false,
          displayLabel: "+12025550101",
          remoteNumber: "+12025550101",
          activeSinceMs: null,
          isRemoteHold: false,
          dtmfHistory: "",
          lastDtmfTone: null,
        },
        {
          callId: "call-2",
          role: "consultation",
          state: "Active",
          muted: false,
          displayLabel: "+12025550102",
          remoteNumber: "+12025550102",
          activeSinceMs: 1_000,
          isRemoteHold: false,
          dtmfHistory: "",
          lastDtmfTone: null,
        },
      ],
    });

    expect(screen.getByTestId("control-attended-transfer")).toHaveTextContent("Завершить перевод");
    expect(screen.queryByTestId("transfer-footer-cancel")).not.toBeInTheDocument();
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

  it("shows transfer target candidates excluding source line", () => {
    renderPanel({
      targetNumber: "",
      lines: [
        createCallLine({
          callId: "call-1",
          role: "source",
          state: "Held",
          displayLabel: "Иван",
          remoteNumber: "+12025550101",
        }),
        createCallLine({
          callId: "call-2",
          role: "primary",
          state: "Active",
          displayLabel: "Мария",
          remoteNumber: "+12025550102",
        }),
      ],
    });

    expect(screen.getByTestId("transfer-target-candidates")).toBeInTheDocument();
    expect(screen.getByTestId("transfer-target-candidate-call-2")).toBeInTheDocument();
    expect(screen.queryByTestId("transfer-target-candidate-call-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("transfer-target-candidate-call-2")).toHaveTextContent("Мария");
  });

  it("fills target input when candidate is selected", async () => {
    const user = userEvent.setup();
    const onTargetChange = vi.fn();
    renderPanel({
      targetNumber: "",
      onTargetChange,
      lines: [
        createCallLine({
          callId: "call-1",
          role: "source",
          state: "Held",
          remoteNumber: "+12025550101",
        }),
        createCallLine({
          callId: "call-2",
          role: "primary",
          state: "Held",
          displayLabel: "Мария",
          remoteNumber: "+12025550102",
        }),
      ],
    });

    await user.click(screen.getByTestId("transfer-target-candidate-call-2"));

    expect(onTargetChange).toHaveBeenCalledWith("+12025550102");
  });

  it("hides candidates when only source line exists", () => {
    renderPanel({
      targetNumber: "",
      lines: [
        createCallLine({
          callId: "call-1",
          role: "source",
          state: "Held",
          remoteNumber: "+12025550101",
        }),
      ],
    });

    expect(screen.queryByTestId("transfer-target-candidates")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transfer-target-divider")).not.toBeInTheDocument();
  });

  it("renders number input before divider and session candidates", () => {
    renderPanel({
      targetNumber: "",
      lines: [
        createCallLine({
          callId: "call-1",
          role: "source",
          state: "Held",
          remoteNumber: "+12025550101",
        }),
        createCallLine({
          callId: "call-2",
          role: "primary",
          state: "Active",
          remoteNumber: "+12025550102",
        }),
      ],
    });

    const input = screen.getByTestId("transfer-target-input");
    const divider = screen.getByTestId("transfer-target-divider");
    const candidate = screen.getByTestId("transfer-target-candidate-call-2");

    expect(divider).toHaveTextContent("или");
    expect(
      input.compareDocumentPosition(divider) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      divider.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("disables number input when session candidate is selected", async () => {
    const user = userEvent.setup();
    renderPanel({
      targetNumber: "",
      lines: [
        createCallLine({
          callId: "call-1",
          role: "source",
          state: "Held",
          remoteNumber: "+12025550101",
        }),
        createCallLine({
          callId: "call-2",
          role: "primary",
          state: "Held",
          remoteNumber: "+12025550102",
        }),
      ],
    });

    await user.click(screen.getByTestId("transfer-target-candidate-call-2"));

    expect(screen.getByTestId("transfer-target-input")).toBeDisabled();
    expect(screen.getByTestId("transfer-target-candidate-call-2")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("disables session candidates when number is entered manually", async () => {
    const user = userEvent.setup();
    renderPanel({
      targetNumber: "",
      lines: [
        createCallLine({
          callId: "call-1",
          role: "source",
          state: "Held",
          remoteNumber: "+12025550101",
        }),
        createCallLine({
          callId: "call-2",
          role: "primary",
          state: "Held",
          remoteNumber: "+12025550102",
        }),
      ],
    });

    await user.type(screen.getByTestId("transfer-target-input"), "4");

    expect(screen.getByTestId("transfer-target-candidate-call-2")).toBeDisabled();
    expect(screen.getByTestId("transfer-target-input")).not.toBeDisabled();
  });

  it("re-enables number input when selected session is toggled off", async () => {
    const user = userEvent.setup();
    const onTargetChange = vi.fn();
    renderPanel({
      targetNumber: "",
      onTargetChange,
      lines: [
        createCallLine({
          callId: "call-1",
          role: "source",
          state: "Held",
          remoteNumber: "+12025550101",
        }),
        createCallLine({
          callId: "call-2",
          role: "primary",
          state: "Held",
          remoteNumber: "+12025550102",
        }),
      ],
    });

    const candidate = screen.getByTestId("transfer-target-candidate-call-2");
    await user.click(candidate);
    await user.click(candidate);

    expect(screen.getByTestId("transfer-target-input")).not.toBeDisabled();
    expect(onTargetChange).toHaveBeenLastCalledWith("");
  });
});

type TransferPanelOverrides = Partial<Parameters<typeof TransferPanel>[0]>;

function createCallLine(
  overrides: Partial<CallLine> & Pick<CallLine, "callId" | "state">,
): CallLine {
  return {
    callId: overrides.callId,
    role: overrides.role ?? "primary",
    state: overrides.state,
    muted: overrides.muted ?? false,
    displayLabel: overrides.displayLabel ?? "+12025550100",
    remoteNumber: overrides.remoteNumber ?? overrides.displayLabel ?? "+12025550100",
    activeSinceMs: overrides.activeSinceMs ?? null,
    isRemoteHold: overrides.isRemoteHold ?? false,
    dtmfHistory: overrides.dtmfHistory ?? "",
    lastDtmfTone: overrides.lastDtmfTone ?? null,
  };
}

function renderPanel(overrides: TransferPanelOverrides = {}): void {
  const props: Parameters<typeof TransferPanel>[0] = {
    visible: true,
    targetNumber: "+12025550100",
    blindTransferDisabledReason: null,
    startConsultationDisabledReason: "second_session_disabled",
    attendedTransferDisabledReason: "consultation_not_active",
    cancelTransferDisabledReason: null,
    transferInProgress: false,
    lines: [
      createCallLine({
        callId: "call-1",
        role: "source",
        state: "Held",
        displayLabel: "+12025550101",
        remoteNumber: "+12025550101",
      }),
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

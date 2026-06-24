// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialpad } from "./Dialpad.js";

afterEach(() => {
  cleanup();
});

describe("Dialpad", () => {
  it("disables call button when number is invalid", () => {
    renderDialpad({ callDisabledReason: "Invalid number" });
    expect(screen.getByTestId("dialpad-call")).toBeDisabled();
    expect(screen.getByTestId("dialpad-disabled-reason")).toHaveTextContent(
      "Invalid number",
    );
  });

  it("does not insert zero on hover leave without press", () => {
    const onNumberChange = vi.fn();
    renderDialpad({ onNumberChange });

    fireEvent.mouseLeave(screen.getByTestId("dialpad-key-0"));

    expect(onNumberChange).not.toHaveBeenCalled();
  });

  it("inserts zero on short press", () => {
    const onNumberChange = vi.fn();
    renderDialpad({ onNumberChange, numberValue: "12" });

    fireEvent.mouseDown(screen.getByTestId("dialpad-key-0"));
    fireEvent.mouseUp(screen.getByTestId("dialpad-key-0"));

    expect(onNumberChange).toHaveBeenCalledWith("120");
  });

  it("inserts plus on long press zero", () => {
    vi.useFakeTimers();
    const onNumberChange = vi.fn();
    renderDialpad({ onNumberChange });

    fireEvent.mouseDown(screen.getByTestId("dialpad-key-0"));
    vi.advanceTimersByTime(500);
    fireEvent.mouseUp(screen.getByTestId("dialpad-key-0"));

    expect(onNumberChange).toHaveBeenCalledWith("+");
    vi.useRealTimers();
  });

  it("supports delete and clear actions", () => {
    const onDelete = vi.fn();
    const onClear = vi.fn();
    renderDialpad({ onDelete, onClear });

    fireEvent.click(screen.getByTestId("dialpad-delete"));
    fireEvent.click(screen.getByTestId("dialpad-clear"));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("calls make-call binding on call button press", () => {
    const onCall = vi.fn();
    renderDialpad({ callDisabledReason: null, onCall });
    fireEvent.click(screen.getByTestId("dialpad-call"));
    expect(onCall).toHaveBeenCalledTimes(1);
  });

  it("sends DTMF in active call mode", () => {
    const onSendDtmf = vi.fn();
    renderDialpad({ mode: "dtmf", onSendDtmf });
    fireEvent.click(screen.getByTestId("dialpad-key-5"));
    expect(onSendDtmf).toHaveBeenCalledWith("5");
  });

  it("sends DTMF zero on click without hover side effects", () => {
    const onSendDtmf = vi.fn();
    renderDialpad({ mode: "dtmf", onSendDtmf });

    fireEvent.mouseLeave(screen.getByTestId("dialpad-key-0"));
    fireEvent.click(screen.getByTestId("dialpad-key-0"));

    expect(onSendDtmf).toHaveBeenCalledTimes(1);
    expect(onSendDtmf).toHaveBeenCalledWith("0");
  });
});

type DialpadOverrides = Partial<Parameters<typeof Dialpad>[0]>;

function renderDialpad(overrides: DialpadOverrides = {}): void {
  const props: Parameters<typeof Dialpad>[0] = {
    numberValue: "",
    mode: "number",
    isCalling: false,
    callDisabledReason: null,
    onNumberChange: vi.fn(),
    onDelete: vi.fn(),
    onClear: vi.fn(),
    onCall: vi.fn(),
    onSendDtmf: vi.fn(),
    onModeChange: vi.fn(),
    ...overrides,
  };
  render(<Dialpad {...props} />);
}


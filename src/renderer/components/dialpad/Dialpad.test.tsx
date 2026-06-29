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
    renderDialpad({ callDisabledReason: "Неверный номер", numberValue: "12" });
    expect(screen.getByTestId("dialpad-call")).toBeDisabled();
  });

  it("shows disabled reason on call button when idle without digits", () => {
    renderDialpad({ callDisabledReason: "Не зарегистрирован", inputDisabledReason: "Не зарегистрирован" });
    expect(screen.getByTestId("dialpad-call")).toBeDisabled();
    expect(screen.getByTestId("dialpad-call")).toHaveTextContent("Не зарегистрирован");
  });

  it("disables dialpad keys when input is blocked by registration", () => {
    const onNumberChange = vi.fn();
    renderDialpad({
      callDisabledReason: "Не зарегистрирован",
      inputDisabledReason: "Не зарегистрирован",
      onNumberChange,
    });

    expect(screen.getByTestId("dialpad-key-1")).toBeDisabled();
    fireEvent.click(screen.getByTestId("dialpad-key-1"));
    expect(onNumberChange).not.toHaveBeenCalled();
  });

  it("shows registration reason in placeholder when input is blocked", () => {
    renderDialpad({ inputDisabledReason: "Не зарегистрирован" });
    expect(screen.getByTestId("dialpad-input")).toHaveAttribute("placeholder", "Не зарегистрирован");
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

  it("shows inline delete when number has digits", () => {
    const onDelete = vi.fn();
    renderDialpad({ numberValue: "123", onDelete });

    fireEvent.click(screen.getByTestId("dialpad-delete"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("hides inline delete when number is empty", () => {
    renderDialpad({ numberValue: "" });
    expect(screen.queryByTestId("dialpad-delete")).not.toBeInTheDocument();
  });

  it("calls make-call binding on call button press", () => {
    const onCall = vi.fn();
    renderDialpad({ callDisabledReason: null, numberValue: "12345", onCall });
    fireEvent.click(screen.getByTestId("dialpad-call"));
    expect(onCall).toHaveBeenCalledTimes(1);
  });

  it("hides keypad when established call exists and input is empty", () => {
    renderDialpad({ hasEstablishedCall: true, numberValue: "" });
    expect(screen.queryByTestId("dialpad-key-1")).not.toBeInTheDocument();
  });

  it("returns null in dtmf mode", () => {
    const { container } = renderDialpad({ mode: "dtmf" });
    expect(container).toBeEmptyDOMElement();
  });
});

type DialpadOverrides = Partial<Parameters<typeof Dialpad>[0]>;

function renderDialpad(overrides: DialpadOverrides = {}): ReturnType<typeof render> {
  const props: Parameters<typeof Dialpad>[0] = {
    numberValue: "",
    mode: "number",
    isCalling: false,
    callDisabledReason: null,
    inputDisabledReason: null,
    onNumberChange: vi.fn(),
    onDelete: vi.fn(),
    onCall: vi.fn(),
    onSendDtmf: vi.fn(),
    onModeChange: vi.fn(),
    ...overrides,
  };
  return render(<Dialpad {...props} />);
}

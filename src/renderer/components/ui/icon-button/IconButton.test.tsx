// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ICON_TOOLTIP_DELAY_MS } from "../../icons/iconTooltipDelay.js";
import { IconButton } from "./IconButton.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("IconButton", () => {
  beforeEach(() => {
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("requires accessible label through props type", () => {
    render(<IconButton iconId="overlay.close" ariaLabel="Close panel" />);

    expect(screen.getByRole("button", { name: "Close panel" })).toBeInTheDocument();
  });

  it("defaults native type to button", () => {
    render(<IconButton iconId="overlay.close" ariaLabel="Close panel" />);

    expect(screen.getByRole("button", { name: "Close panel" })).toHaveAttribute("type", "button");
  });

  it("forwards ref to the native button", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<IconButton ref={ref} iconId="overlay.close" ariaLabel="Close panel" />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveAttribute("aria-label", "Close panel");
  });

  it("preserves caller className", () => {
    render(
      <IconButton iconId="overlay.close" ariaLabel="Close panel" className="custom-icon-action" />,
    );

    expect(screen.getByRole("button", { name: "Close panel" })).toHaveClass("custom-icon-action");
  });

  it("renders semantic icon", () => {
    const { container } = render(
      <IconButton iconId="shell.settings" ariaLabel="Open settings" />,
    );

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("calls onClick when enabled", () => {
    const onClick = vi.fn();

    render(
      <IconButton iconId="overlay.close" ariaLabel="Close" onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not trigger when disabled reason exists", () => {
    const onClick = vi.fn();

    render(
      <IconButton
        iconId="dial.call"
        ariaLabel="Call"
        disabledReason="Not registered"
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Call" }));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Call" })).toBeDisabled();
  });

  it("does not call onClick when loading", () => {
    const onClick = vi.fn();

    render(
      <IconButton iconId="overlay.close" ariaLabel="Close" loading onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("sets native disabled while loading", () => {
    render(<IconButton iconId="overlay.close" ariaLabel="Close" loading />);

    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
  });

  it("does not call onClick when disabled prop is true", () => {
    const onClick = vi.fn();

    render(
      <IconButton iconId="overlay.close" ariaLabel="Close" disabled onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
  });

  it("shows disabledReason through tooltip", () => {
    vi.useFakeTimers();

    render(
      <IconButton
        iconId="dial.call"
        ariaLabel="Call"
        disabledReason="SIP not registered"
        tooltipLabel="Call"
      />,
    );

    fireEvent.pointerEnter(screen.getByTestId("icon-tooltip-host"));
    act(() => {
      vi.advanceTimersByTime(ICON_TOOLTIP_DELAY_MS);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("SIP not registered");
  });

  it("protects controlled disabled, loading, and label attributes from native prop override", () => {
    const onClick = vi.fn();

    render(
      <IconButton
        iconId="overlay.close"
        ariaLabel="Protected label"
        loading
        disabled
        onClick={onClick}
        aria-busy={false}
        data-loading="false"
        aria-label="Override label"
      />,
    );

    const button = screen.getByRole("button", { name: "Protected label" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-loading", "true");

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows tooltip label through tooltip wrapper", () => {
    vi.useFakeTimers();

    render(
      <IconButton
        iconId="shell.settings"
        ariaLabel="Settings"
        tooltipLabel="Open settings"
      />,
    );

    fireEvent.pointerEnter(screen.getByTestId("icon-tooltip-host"));
    act(() => {
      vi.advanceTimersByTime(ICON_TOOLTIP_DELAY_MS);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Open settings");
  });
});

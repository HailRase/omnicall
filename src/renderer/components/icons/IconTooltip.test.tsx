// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ICON_TOOLTIP_DELAY_MS } from "./iconTooltipDelay.js";
import { IconTooltip } from "./IconTooltip.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("IconTooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
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

  it("shows tooltip after 1000ms pointer hover", () => {
    render(
      <IconTooltip label="Settings">
        <button type="button">Icon</button>
      </IconTooltip>,
    );

    fireEvent.pointerEnter(screen.getByTestId("icon-tooltip-host"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(ICON_TOOLTIP_DELAY_MS);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Settings");
  });

  it("hides tooltip on pointer leave before delay elapses", () => {
    render(
      <IconTooltip label="Diagnostics">
        <button type="button">Icon</button>
      </IconTooltip>,
    );

    const host = screen.getByTestId("icon-tooltip-host");
    fireEvent.pointerEnter(host);
    act(() => {
      vi.advanceTimersByTime(ICON_TOOLTIP_DELAY_MS - 1);
    });
    fireEvent.pointerLeave(host);
    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip immediately when reduced motion is preferred", () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <IconTooltip label="Hold">
        <button type="button">Icon</button>
      </IconTooltip>,
    );

    fireEvent.pointerEnter(screen.getByTestId("icon-tooltip-host"));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Hold");
  });
});

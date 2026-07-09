// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import type { JSX } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useListRowActionReveal } from "./useListRowActionReveal.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Probe(): JSX.Element {
  const { isActionVisible, rowInteractionProps } = useListRowActionReveal();

  return (
    <div data-testid="row" data-visible={isActionVisible ? "true" : "false"} {...rowInteractionProps} />
  );
}

describe("useListRowActionReveal", () => {
  it("keeps actions visible when hover is not available", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { getByTestId } = render(<Probe />);
    expect(getByTestId("row")).toHaveAttribute("data-visible", "true");
  });

  it("reveals actions on row hover for hover-capable devices", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: query === "(hover: hover) and (pointer: fine)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { getByTestId } = render(<Probe />);
    expect(getByTestId("row")).toHaveAttribute("data-visible", "false");

    fireEvent.mouseEnter(getByTestId("row"));
    expect(getByTestId("row")).toHaveAttribute("data-visible", "true");

    fireEvent.mouseLeave(getByTestId("row"));
    expect(getByTestId("row")).toHaveAttribute("data-visible", "false");
  });
});

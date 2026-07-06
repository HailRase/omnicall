// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Spinner } from "./Spinner.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Spinner", () => {
  beforeEach(() => {
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("exposes status semantics when not decorative", () => {
    render(<Spinner label="Loading data" />);

    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-label", "Loading data");
    expect(status).toHaveAttribute("data-size", "md");
  });

  it("hides from the accessibility tree when decorative", () => {
    render(<Spinner decorative label="Ignored label" />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    const spinner = document.querySelector("[data-decorative='true']");

    expect(spinner).toHaveAttribute("aria-hidden", "true");
    expect(spinner).not.toHaveAttribute("aria-label");
  });

  it("forwards ref to the root element", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<Spinner ref={ref} label="Loading" />);

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current).toHaveAttribute("data-size", "md");
  });

  it("preserves caller className", () => {
    render(<Spinner className="custom-spinner" label="Loading" />);

    expect(screen.getByRole("status")).toHaveClass("custom-spinner");
  });

  it("renders requested size variant", () => {
    render(<Spinner size="lg" label="Loading" />);

    expect(screen.getByRole("status")).toHaveAttribute("data-size", "lg");
  });

  it("renders decorative spinner ring as hidden from assistive tech", () => {
    render(<Spinner label="Loading" />);

    const ring = screen.getByRole("status").querySelector("[aria-hidden='true']");

    expect(ring).toBeInTheDocument();
  });

  it("protects controlled accessibility attributes from native prop override", () => {
    render(
      <Spinner
        decorative
        label="Loading"
        aria-hidden="false"
        role="alert"
        aria-live="assertive"
        data-decorative="false"
      />,
    );

    const spinner = document.querySelector("[data-decorative='true']");

    expect(spinner).toHaveAttribute("aria-hidden", "true");
    expect(spinner).not.toHaveAttribute("role");
    expect(spinner).not.toHaveAttribute("aria-live");
    expect(spinner).not.toHaveAttribute("aria-label");
  });
});

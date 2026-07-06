// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Progress } from "./Progress.js";

afterEach(() => {
  cleanup();
});

describe("Progress", () => {
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

  it("exposes progressbar role", () => {
    render(<Progress value={40} aria-label="Upload progress" />);

    expect(screen.getByRole("progressbar", { name: "Upload progress" })).toBeInTheDocument();
  });

  it("reflects determinate value", () => {
    render(<Progress value={45} max={100} aria-label="File upload" />);

    const progressbar = screen.getByRole("progressbar", { name: "File upload" });
    expect(progressbar).toHaveAttribute("aria-valuenow", "45");
    expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");
    expect(progressbar).toHaveAttribute("data-state", "loading");
  });

  it("handles indeterminate state", () => {
    render(<Progress value={null} aria-label="Loading content" />);

    const progressbar = screen.getByRole("progressbar", { name: "Loading content" });
    expect(progressbar).not.toHaveAttribute("aria-valuenow");
    expect(progressbar).toHaveAttribute("data-state", "indeterminate");
    expect(progressbar.querySelector("[data-state='indeterminate']")).not.toBeNull();
  });

  it("renders optional label and links it to the progressbar", () => {
    render(<Progress value={60} label="Syncing contacts" />);

    const label = screen.getByText("Syncing contacts");
    expect(label).toBeInTheDocument();

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-labelledby", label.id);
  });

  it("applies tone data attribute", () => {
    render(<Progress value={80} tone="success" aria-label="Success progress" />);

    expect(screen.getByRole("progressbar", { name: "Success progress" })).toHaveAttribute(
      "data-tone",
      "success",
    );
  });

  it("forwards ref to the progress root", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Progress ref={ref} value={25} aria-label="Ref progress" />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute("role", "progressbar");
  });

  it("preserves caller className on progress root", () => {
    render(<Progress value={10} className="custom-progress" aria-label="Styled progress" />);

    expect(screen.getByRole("progressbar", { name: "Styled progress" })).toHaveClass(
      "custom-progress",
    );
  });

  it("protects internally controlled tone from native prop override", () => {
    render(
      <Progress
        value={30}
        tone="destructive"
        data-tone="default"
        aria-label="Protected progress"
      />,
    );

    expect(screen.getByRole("progressbar", { name: "Protected progress" })).toHaveAttribute(
      "data-tone",
      "destructive",
    );
  });

  it("marks complete state when value reaches max", () => {
    render(<Progress value={100} max={100} aria-label="Complete progress" />);

    expect(screen.getByRole("progressbar", { name: "Complete progress" })).toHaveAttribute(
      "data-state",
      "complete",
    );
  });
});

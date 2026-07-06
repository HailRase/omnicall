// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton.js";

afterEach(() => {
  cleanup();
});

describe("Skeleton", () => {
  it("renders without accessible fake text", () => {
    const { container } = render(<Skeleton data-testid="skeleton" />);
    const skeleton = container.querySelector("[data-testid='skeleton']");

    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(skeleton).toHaveTextContent("");
    expect(skeleton).not.toHaveAttribute("role");
  });

  it("applies requested shape", () => {
    const { container, rerender } = render(<Skeleton shape="text" data-testid="skeleton" />);
    const skeleton = container.querySelector("[data-testid='skeleton']");

    expect(skeleton).toHaveAttribute("data-shape", "text");

    rerender(<Skeleton shape="rectangle" data-testid="skeleton" />);
    expect(skeleton).toHaveAttribute("data-shape", "rectangle");

    rerender(<Skeleton shape="circle" data-testid="skeleton" />);
    expect(skeleton).toHaveAttribute("data-shape", "circle");
  });

  it("defaults to text shape", () => {
    const { container } = render(<Skeleton data-testid="skeleton" />);

    expect(container.querySelector("[data-testid='skeleton']")).toHaveAttribute("data-shape", "text");
  });

  it("forwards ref to the root div", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Skeleton ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("preserves caller className", () => {
    const { container } = render(<Skeleton className="custom-skeleton" data-testid="skeleton" />);

    expect(container.querySelector("[data-testid='skeleton']")).toHaveClass("custom-skeleton");
  });

  it("applies custom width and height", () => {
    const { container } = render(
      <Skeleton shape="rectangle" width={180} height="4rem" data-testid="skeleton" />,
    );
    const skeleton = container.querySelector("[data-testid='skeleton']");

    expect(skeleton).toHaveStyle({ width: "180px", height: "4rem" });
  });

  it("protects controlled accessibility attributes from native prop override", () => {
    const { container } = render(
      <Skeleton aria-hidden={false} data-shape="rectangle" data-testid="skeleton" />,
    );
    const skeleton = container.querySelector("[data-testid='skeleton']");

    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(skeleton).toHaveAttribute("data-shape", "text");
  });

  it("merges native style with width and height overrides", () => {
    const { container } = render(
      <Skeleton
        shape="text"
        width="50%"
        style={{ marginTop: "8px" }}
        data-testid="skeleton"
      />,
    );
    const skeleton = container.querySelector("[data-testid='skeleton']");

    expect(skeleton).toHaveStyle({ width: "50%", marginTop: "8px" });
  });
});

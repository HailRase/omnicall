// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./Button.js";

afterEach(() => {
  cleanup();
});

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Save changes</Button>);

    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("defaults native type to button", () => {
    render(<Button>Action</Button>);

    expect(screen.getByRole("button", { name: "Action" })).toHaveAttribute("type", "button");
  });

  it("forwards ref to the native button", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Button ref={ref}>Action</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveTextContent("Action");
  });

  it("preserves caller className", () => {
    render(<Button className="custom-action">Action</Button>);

    expect(screen.getByRole("button", { name: "Action" })).toHaveClass("custom-action");
  });

  it("calls onClick when enabled", () => {
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Continue</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();

    render(
      <Button disabled onClick={onClick}>
        Continue
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not call onClick when loading", () => {
    const onClick = vi.fn();

    render(
      <Button loading onClick={onClick}>
        Continue
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("sets native disabled while loading", () => {
    render(<Button loading>Saving</Button>);

    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
  });

  it("exposes busy state when loading", () => {
    render(<Button loading>Saving</Button>);

    expect(screen.getByRole("button", { name: "Saving" })).toHaveAttribute("aria-busy", "true");
  });

  it("protects controlled disabled and loading attributes from native prop override", () => {
    const onClick = vi.fn();

    render(
      <Button
        loading
        disabled
        onClick={onClick}
        aria-busy={false}
        data-loading="false"
      >
        Saving
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Saving" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-loading", "true");

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

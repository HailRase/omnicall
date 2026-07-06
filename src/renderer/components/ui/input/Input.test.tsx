// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "./Input.js";

afterEach(() => {
  cleanup();
});

describe("Input", () => {
  it("renders as textbox for text input", () => {
    render(<Input aria-label="Username" defaultValue="agent" />);

    expect(screen.getByRole("textbox", { name: "Username" })).toHaveValue("agent");
  });

  it("forwards value changes", () => {
    const onChange = vi.fn();

    render(<Input aria-label="Search" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "query" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("applies aria-invalid when invalid", () => {
    render(<Input aria-label="Email" invalid />);

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("does not call change handler when disabled", () => {
    const onChange = vi.fn();

    render(<Input aria-label="Code" disabled onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Code" }), {
      target: { value: "123" },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards ref to the native input", () => {
    const ref = createRef<HTMLInputElement>();

    render(<Input ref={ref} aria-label="Extension" defaultValue="101" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveValue("101");
  });

  it("preserves caller className", () => {
    render(<Input aria-label="Host" className="custom-host-input" />);

    expect(screen.getByRole("textbox", { name: "Host" })).toHaveClass("custom-host-input");
  });

  it("exposes readonly state through data attribute", () => {
    render(<Input aria-label="Readonly field" readOnly defaultValue="locked" />);

    expect(screen.getByRole("textbox", { name: "Readonly field" })).toHaveAttribute(
      "data-readonly",
      "true",
    );
  });

  it("renders prefix and suffix affixes", () => {
    render(
      <Input
        aria-label="Amount"
        prefix="$"
        suffix="USD"
        defaultValue="10"
      />,
    );

    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Amount" })).toHaveValue("10");
  });

  it("protects controlled invalid and disabled attributes from native prop override", () => {
    const onChange = vi.fn();

    render(
      <Input
        aria-label="Protected"
        invalid
        disabled
        onChange={onChange}
        aria-invalid={false}
        data-invalid="false"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Protected" });

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("data-invalid", "true");

    fireEvent.change(input, { target: { value: "next" } });
    expect(onChange).not.toHaveBeenCalled();
  });
});

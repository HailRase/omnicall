// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Textarea } from "./Textarea.js";

afterEach(() => {
  cleanup();
});

describe("Textarea", () => {
  it("renders multiline textbox", () => {
    render(<Textarea aria-label="Notes" defaultValue="Line one" />);

    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue("Line one");
  });

  it("forwards value changes", () => {
    const onChange = vi.fn();

    render(<Textarea aria-label="Description" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Updated text" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("applies aria-invalid when invalid", () => {
    render(<Textarea aria-label="Comment" invalid />);

    expect(screen.getByRole("textbox", { name: "Comment" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("does not call change handler when disabled", () => {
    const onChange = vi.fn();

    render(<Textarea aria-label="Locked notes" disabled onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Locked notes" }), {
      target: { value: "next" },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards ref to the native textarea", () => {
    const ref = createRef<HTMLTextAreaElement>();

    render(<Textarea ref={ref} aria-label="Memo" defaultValue="draft" />);

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current).toHaveValue("draft");
  });

  it("preserves caller className", () => {
    render(<Textarea aria-label="Body" className="custom-textarea" />);

    expect(screen.getByRole("textbox", { name: "Body" })).toHaveClass("custom-textarea");
  });

  it("exposes readonly state through data attribute", () => {
    render(<Textarea aria-label="Readonly notes" readOnly defaultValue="locked" />);

    expect(screen.getByRole("textbox", { name: "Readonly notes" })).toHaveAttribute(
      "data-readonly",
      "true",
    );
  });

  it("applies resize policy through data attribute", () => {
    render(<Textarea aria-label="No resize" resize="none" />);

    expect(screen.getByRole("textbox", { name: "No resize" })).toHaveAttribute(
      "data-resize",
      "none",
    );
  });

  it("protects controlled invalid and disabled attributes from native prop override", () => {
    const onChange = vi.fn();

    render(
      <Textarea
        aria-label="Protected"
        invalid
        disabled
        onChange={onChange}
        aria-invalid={false}
        data-invalid="false"
      />,
    );

    const textarea = screen.getByRole("textbox", { name: "Protected" });

    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("data-invalid", "true");

    fireEvent.change(textarea, { target: { value: "next" } });
    expect(onChange).not.toHaveBeenCalled();
  });
});

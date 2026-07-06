// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Label } from "./Label.js";

afterEach(() => {
  cleanup();
});

describe("Label", () => {
  it("renders label text", () => {
    render(<Label>Email address</Label>);

    expect(screen.getByText("Email address")).toBeInTheDocument();
  });

  it("associates with a control through htmlFor", () => {
    render(
      <>
        <Label htmlFor="email-input">Email address</Label>
        <input id="email-input" type="email" />
      </>,
    );

    const label = screen.getByText("Email address");
    const input = screen.getByRole("textbox");

    expect(label).toHaveAttribute("for", "email-input");
    expect(input).toHaveAttribute("id", "email-input");
  });

  it("renders required indicator when requested", () => {
    render(<Label required>Username</Label>);

    const label = screen.getByText("Username").closest("label");

    expect(label).toHaveAttribute("data-required", "true");
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not render required indicator by default", () => {
    render(<Label>Username</Label>);

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("forwards ref to the native label", () => {
    const ref = createRef<HTMLLabelElement>();

    render(<Label ref={ref}>Field name</Label>);

    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    expect(ref.current).toHaveTextContent("Field name");
  });

  it("preserves caller className", () => {
    render(<Label className="custom-label">Field name</Label>);

    expect(screen.getByText("Field name").closest("label")).toHaveClass("custom-label");
  });

  it("exposes disabled visual state", () => {
    render(<Label disabled>Field name</Label>);

    expect(screen.getByText("Field name").closest("label")).toHaveAttribute("data-disabled", "true");
  });

  it("protects controlled data attributes from native prop override", () => {
    render(
      <Label required disabled data-required="false" data-disabled="false">
        Field name
      </Label>,
    );

    const label = screen.getByText("Field name").closest("label");

    expect(label).toHaveAttribute("data-required", "true");
    expect(label).toHaveAttribute("data-disabled", "true");
  });
});

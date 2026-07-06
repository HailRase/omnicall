// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "../input/Input.js";
import { FormField } from "./FormField.js";

afterEach(() => {
  cleanup();
});

describe("FormField", () => {
  it("connects label to control", () => {
    render(
      <FormField label="Email address">
        <Input placeholder="name@example.com" />
      </FormField>,
    );

    const input = screen.getByRole("textbox");
    const label = screen.getByText("Email address").closest("label");

    expect(label).toHaveAttribute("for", input.id);
    expect(input).toHaveAttribute("id", expect.stringContaining("-control"));
  });

  it("connects hint with aria-describedby", () => {
    render(
      <FormField label="Username" hint="Use your operator login.">
        <Input />
      </FormField>,
    );

    const input = screen.getByRole("textbox");
    const hint = screen.getByText("Use your operator login.");

    expect(input).toHaveAttribute("aria-describedby", expect.stringContaining(hint.id));
  });

  it("connects error with aria-describedby and aria-invalid", () => {
    render(
      <FormField label="Password" error="Password is required.">
        <Input type="password" />
      </FormField>,
    );

    const input = screen.getByLabelText("Password");
    const error = screen.getByText("Password is required.");

    expect(input).toHaveAttribute("aria-describedby", expect.stringContaining(error.id));
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("data-invalid", "true");
  });

  it("gives error priority over hint when both exist", () => {
    render(
      <FormField
        label="Host"
        hint="Include protocol if required."
        error="Host is unreachable."
      >
        <Input defaultValue="bad-host" />
      </FormField>,
    );

    const input = screen.getByRole("textbox");

    expect(screen.queryByText("Include protocol if required.")).not.toBeInTheDocument();
    expect(screen.getByText("Host is unreachable.")).toBeInTheDocument();
    expect(input).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining(screen.getByText("Host is unreachable.").id),
    );
    expect(input.getAttribute("aria-describedby")).not.toContain("hint");
  });

  it("forwards disabled state to label and control", () => {
    const onChange = vi.fn();

    render(
      <FormField label="Extension" disabled>
        <Input onChange={onChange} defaultValue="101" />
      </FormField>,
    );

    const input = screen.getByRole("textbox");
    const label = screen.getByText("Extension").closest("label");

    expect(label).toHaveAttribute("data-disabled", "true");
    expect(input).toBeDisabled();

    fireEvent.change(input, { target: { value: "102" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders required indicator on label", () => {
    render(
      <FormField label="Display name" required>
        <Input />
      </FormField>,
    );

    expect(screen.getByText("Display name").closest("label")).toHaveAttribute(
      "data-required",
      "true",
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("forwards ref to the root field container", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <FormField ref={ref} label="Code">
        <Input />
      </FormField>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toContainElement(screen.getByText("Code"));
  });

  it("preserves caller className on root", () => {
    render(
      <FormField className="custom-form-field" label="Token">
        <Input />
      </FormField>,
    );

    expect(screen.getByText("Token").closest("div.custom-form-field")).toBeInTheDocument();
  });

  it("merges existing aria-describedby on the control", () => {
    render(
      <FormField label="SIP URI" hint="Example: sip:agent@pbx.local">
        <Input aria-describedby="external-help" />
      </FormField>,
    );

    const input = screen.getByRole("textbox");
    const hint = screen.getByText("Example: sip:agent@pbx.local");

    expect(input.getAttribute("aria-describedby")).toContain("external-help");
    expect(input.getAttribute("aria-describedby")).toContain(hint.id);
  });

  it("protects controlled ids and invalid state from child prop override", () => {
    render(
      <FormField label="Server" error="Invalid server address.">
        <Input id="caller-id" aria-invalid={false} invalid={false} aria-describedby="caller-desc" />
      </FormField>,
    );

    const input = screen.getByRole("textbox");
    const error = screen.getByText("Invalid server address.");

    expect(input.id).not.toBe("caller-id");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("data-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(error.id);
    expect(input.getAttribute("aria-describedby")).toContain("caller-desc");
  });
});

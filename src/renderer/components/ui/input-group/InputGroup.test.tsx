// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./InputGroup.js";
import styles from "./InputGroup.module.css";

afterEach(() => {
  cleanup();
});

describe("InputGroup", () => {
  it("renders grouped input with addon text", () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Host" defaultValue="example.com" />
      </InputGroup>,
    );

    expect(screen.getByText("https://")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Host" })).toHaveValue("example.com");
    const group = document.querySelector('[data-slot="input-group"]');
    expect(group).toBeInTheDocument();
    expect(group).toHaveClass(styles.group ?? "");
  });

  it("keeps inline end addon beside the control for visibility toggles", () => {
    render(
      <InputGroup data-testid="inline-group">
        <InputGroupInput aria-label="Secret" />
        <InputGroupAddon align="inline-end" data-testid="inline-addon">
          <InputGroupButton type="button" size="icon-sm" aria-label="Reveal">
            eye
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );

    const group = screen.getByTestId("inline-group");
    const addon = screen.getByTestId("inline-addon");
    expect(group).toHaveClass(styles.group ?? "");
    expect(addon).toHaveAttribute("data-align", "inline-end");
    expect(addon).toHaveClass(styles.addonAlignInlineEnd ?? "");
  });

  it("forwards value changes from InputGroupInput", () => {
    const onChange = vi.fn();

    render(
      <InputGroup>
        <InputGroupInput aria-label="Search" onChange={onChange} />
      </InputGroup>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "query" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("applies aria-invalid on InputGroupInput when invalid", () => {
    render(
      <InputGroup>
        <InputGroupInput aria-label="Email" invalid />
      </InputGroup>,
    );

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("does not call change handler when InputGroupInput is disabled", () => {
    const onChange = vi.fn();

    render(
      <InputGroup>
        <InputGroupInput aria-label="Code" disabled onChange={onChange} />
      </InputGroup>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Code" }), {
      target: { value: "123" },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards ref to InputGroupInput", () => {
    const ref = createRef<HTMLInputElement>();

    render(
      <InputGroup>
        <InputGroupInput ref={ref} aria-label="Extension" defaultValue="101" />
      </InputGroup>,
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveValue("101");
  });

  it("forwards ref to InputGroup root", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <InputGroup ref={ref}>
        <InputGroupInput aria-label="Field" />
      </InputGroup>,
    );

    expect(ref.current).toHaveAttribute("data-slot", "input-group");
  });

  it("preserves caller className on root and control", () => {
    render(
      <InputGroup className="custom-group">
        <InputGroupInput aria-label="Host" className="custom-control" />
      </InputGroup>,
    );

    expect(document.querySelector('[data-slot="input-group"]')).toHaveClass("custom-group");
    expect(screen.getByRole("textbox", { name: "Host" })).toHaveClass("custom-control");
  });

  it("reflects disabled and invalid state on the group container", () => {
    render(
      <InputGroup>
        <InputGroupInput aria-label="Protected" disabled invalid />
      </InputGroup>,
    );

    const group = document.querySelector('[data-slot="input-group"]');

    expect(group).toHaveAttribute("data-disabled", "true");
    expect(group).toHaveAttribute("data-invalid", "true");
  });

  it("focuses the control when addon is clicked", () => {
    render(
      <InputGroup>
        <InputGroupAddon data-testid="prefix-addon">
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Username" />
      </InputGroup>,
    );

    const input = screen.getByRole("textbox", { name: "Username" });
    const addon = screen.getByTestId("prefix-addon");

    fireEvent.click(addon);

    expect(document.activeElement).toBe(input);
  });

  it("does not focus control when addon button is clicked", () => {
    const onClick = vi.fn();

    render(
      <InputGroup>
        <InputGroupAddon data-testid="suffix-addon">
          <InputGroupButton aria-label="Copy" onClick={onClick}>
            Copy
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupInput aria-label="Token" defaultValue="abc" />
      </InputGroup>,
    );

    const input = screen.getByRole("textbox", { name: "Token" });
    input.blur();

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(input);
  });

  it("renders InputGroupTextarea as multiline control", () => {
    render(
      <InputGroup>
        <InputGroupTextarea aria-label="Message" defaultValue="Hello" />
      </InputGroup>,
    );

    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Hello");
  });

  it("protects controlled invalid and disabled attributes from native prop override", () => {
    const onChange = vi.fn();

    render(
      <InputGroup>
        <InputGroupInput
          aria-label="Protected"
          invalid
          disabled
          onChange={onChange}
          aria-invalid={false}
          data-invalid="false"
        />
      </InputGroup>,
    );

    const input = screen.getByRole("textbox", { name: "Protected" });

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("data-invalid", "true");

    fireEvent.change(input, { target: { value: "next" } });
    expect(onChange).not.toHaveBeenCalled();
  });
});

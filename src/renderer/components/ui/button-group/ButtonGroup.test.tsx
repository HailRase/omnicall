// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../button/Button.js";
import { Label } from "../label/Label.js";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "./ButtonGroup.js";

afterEach(() => {
  cleanup();
});

describe("ButtonGroup", () => {
  it("renders role=group with children", () => {
    render(
      <ButtonGroup aria-label="Actions">
        <Button variant="outline">One</Button>
        <Button variant="outline">Two</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group", { name: "Actions" });
    expect(group).toHaveAttribute("data-slot", "button-group");
    expect(screen.getByRole("button", { name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Two" })).toBeInTheDocument();
  });

  it("applies data-orientation for horizontal and vertical", () => {
    const { rerender } = render(
      <ButtonGroup aria-label="Horizontal">
        <Button variant="outline">A</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("group", { name: "Horizontal" })).toHaveAttribute(
      "data-orientation",
      "horizontal",
    );

    rerender(
      <ButtonGroup aria-label="Vertical" orientation="vertical">
        <Button variant="outline">A</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("group", { name: "Vertical" })).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  it("forwards root ref and preserves className", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <ButtonGroup ref={ref} className="toolbar-group" aria-label="Toolbar">
        <Button variant="outline">Edit</Button>
      </ButtonGroup>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass("toolbar-group");
  });

  it("protects controlled role, data-slot, and data-orientation", () => {
    render(
      <ButtonGroup
        aria-label="Protected"
        orientation="vertical"
        role="navigation"
        data-slot="hacked"
        data-orientation="horizontal"
      >
        <Button variant="outline">Safe</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group", { name: "Protected" });
    expect(group).toHaveAttribute("role", "group");
    expect(group).toHaveAttribute("data-slot", "button-group");
    expect(group).toHaveAttribute("data-orientation", "vertical");
  });

  it("renders decorative separator by default", () => {
    const { container } = render(
      <ButtonGroup aria-label="Copy paste">
        <Button variant="secondary">Copy</Button>
        <ButtonGroupSeparator />
        <Button variant="secondary">Paste</Button>
      </ButtonGroup>,
    );

    const separator = container.querySelector(
      '[data-slot="button-group-separator"]',
    );
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute("data-orientation", "vertical");
    expect(separator).not.toHaveAttribute("role", "separator");
  });

  it("applies separator orientation and semantic role when not decorative", () => {
    render(
      <ButtonGroup orientation="vertical" aria-label="Volume">
        <Button variant="secondary">Up</Button>
        <ButtonGroupSeparator orientation="horizontal" decorative={false} />
        <Button variant="secondary">Down</Button>
      </ButtonGroup>,
    );

    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
    expect(separator).toHaveAttribute("data-slot", "button-group-separator");
  });

  it("renders ButtonGroupText content", () => {
    render(
      <ButtonGroup aria-label="Labeled">
        <ButtonGroupText>https://</ButtonGroupText>
        <Button variant="outline">Open</Button>
      </ButtonGroup>,
    );

    expect(screen.getByText("https://")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="button-group-text"]')).toBeInTheDocument();
  });

  it("supports ButtonGroupText asChild", () => {
    render(
      <ButtonGroup aria-label="With label">
        <ButtonGroupText asChild>
          <Label htmlFor="amount-field">Amount</Label>
        </ButtonGroupText>
        <Button variant="outline" id="amount-field">
          Edit
        </Button>
      </ButtonGroup>,
    );

    const label = screen.getByText("Amount");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("data-slot", "button-group-text");
    expect(label).toHaveAttribute("for", "amount-field");
  });

  it("keeps nested group roles", () => {
    render(
      <ButtonGroup aria-label="Outer">
        <ButtonGroup aria-label="Inner left">
          <Button variant="outline">Left</Button>
        </ButtonGroup>
        <ButtonGroup aria-label="Inner right">
          <Button variant="outline">Right</Button>
        </ButtonGroup>
      </ButtonGroup>,
    );

    expect(screen.getByRole("group", { name: "Outer" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Inner left" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Inner right" })).toBeInTheDocument();
  });

  it("forwards child Button click callbacks", () => {
    const onClick = vi.fn();

    render(
      <ButtonGroup aria-label="Clicks">
        <Button variant="outline" onClick={onClick}>
          Click me
        </Button>
      </ButtonGroup>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Click me" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("forwards separator ref", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <ButtonGroup aria-label="Split">
        <Button variant="secondary">Main</Button>
        <ButtonGroupSeparator ref={ref} />
        <Button variant="secondary">More</Button>
      </ButtonGroup>,
    );

    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toHaveAttribute("data-slot", "button-group-separator");
  });
});

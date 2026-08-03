// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState, type JSX } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { Label } from "../label/Label.js";
import { RadioGroup, RadioGroupItem } from "./RadioGroup.js";

beforeEach(setupJsdomRadix);

afterEach(() => {
  cleanup();
});

function ControlledGroup({
  onValueChange,
}: Readonly<{
  onValueChange?: (value: string) => void;
}>): JSX.Element {
  const [value, setValue] = useState("a");

  function handleValueChange(next: string): void {
    setValue(next);
    onValueChange?.(next);
  }

  return (
    <RadioGroup value={value} onValueChange={handleValueChange} aria-label="Options">
      <div>
        <RadioGroupItem value="a" id="rg-a" aria-labelledby="rg-a-label" />
        <Label htmlFor="rg-a" id="rg-a-label">
          Option A
        </Label>
      </div>
      <div>
        <RadioGroupItem value="b" id="rg-b" aria-labelledby="rg-b-label" />
        <Label htmlFor="rg-b" id="rg-b-label">
          Option B
        </Label>
      </div>
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("selects an item on click and emits value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <RadioGroup defaultValue="a" onValueChange={onValueChange} aria-label="Plan">
        <RadioGroupItem value="a" aria-label="Basic" />
        <RadioGroupItem value="b" aria-label="Pro" />
      </RadioGroup>,
    );

    expect(screen.getByRole("radio", { name: "Basic" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Pro" }));

    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("supports keyboard navigation between items", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <RadioGroup defaultValue="a" onValueChange={onValueChange} aria-label="Keyboard">
        <RadioGroupItem value="a" aria-label="First" />
        <RadioGroupItem value="b" aria-label="Second" />
      </RadioGroup>,
    );

    await user.tab();
    expect(screen.getByRole("radio", { name: "First" })).toHaveFocus();

    // Roving focus moves with arrows; Space selects (jsdom may skip Radix arrow-click sync).
    await user.keyboard("{ArrowDown}");
    const second = screen.getByRole("radio", { name: "Second" });
    expect(second).toHaveFocus();

    await user.keyboard(" ");
    expect(second).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("updates controlled value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<ControlledGroup onValueChange={onValueChange} />);

    await user.click(screen.getByRole("radio", { name: "Option B" }));

    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(screen.getByRole("radio", { name: "Option B" })).toBeChecked();
  });

  it("does not emit when group is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <RadioGroup disabled defaultValue="a" onValueChange={onValueChange} aria-label="Locked">
        <RadioGroupItem value="a" aria-label="Locked A" />
        <RadioGroupItem value="b" aria-label="Locked B" />
      </RadioGroup>,
    );

    await user.click(screen.getByRole("radio", { name: "Locked B" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("does not select a disabled item", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <RadioGroup defaultValue="a" onValueChange={onValueChange} aria-label="Partial">
        <RadioGroupItem value="a" aria-label="Enabled" />
        <RadioGroupItem value="b" disabled aria-label="Disabled item" />
      </RadioGroup>,
    );

    await user.click(screen.getByRole("radio", { name: "Disabled item" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Enabled" })).toBeChecked();
  });

  it("forwards refs and preserves className", () => {
    const rootRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLButtonElement>();

    render(
      <RadioGroup ref={rootRef} className="custom-group" aria-label="Refs" defaultValue="a">
        <RadioGroupItem ref={itemRef} className="custom-item" value="a" aria-label="Ref item" />
      </RadioGroup>,
    );

    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(rootRef.current).toHaveClass("custom-group");
    expect(itemRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(itemRef.current).toHaveClass("custom-item");
  });

  it("applies invalid semantics on an item", () => {
    render(
      <RadioGroup aria-label="Invalid group" defaultValue="a">
        <RadioGroupItem value="a" invalid aria-label="Invalid option" />
      </RadioGroup>,
    );

    const item = screen.getByRole("radio", { name: "Invalid option" });
    expect(item).toHaveAttribute("aria-invalid", "true");
    expect(item).toHaveAttribute("data-invalid", "true");
  });

  it("protects controlled disabled and invalid from native override", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <RadioGroup
        disabled
        onValueChange={onValueChange}
        aria-label="Protected"
        defaultValue="a"
      >
        <RadioGroupItem
          value="b"
          invalid
          aria-label="Protected item"
          aria-invalid={false}
          data-invalid="false"
        />
      </RadioGroup>,
    );

    const item = screen.getByRole("radio", { name: "Protected item" });
    expect(item).toBeDisabled();
    expect(item).toHaveAttribute("aria-invalid", "true");
    expect(item).toHaveAttribute("data-invalid", "true");

    await user.click(item);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("sets horizontal orientation attributes", () => {
    render(
      <RadioGroup orientation="horizontal" aria-label="Horizontal" defaultValue="a">
        <RadioGroupItem value="a" aria-label="H A" />
      </RadioGroup>,
    );

    const group = screen.getByRole("radiogroup", { name: "Horizontal" });
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group).toHaveAttribute("aria-orientation", "horizontal");
  });
});

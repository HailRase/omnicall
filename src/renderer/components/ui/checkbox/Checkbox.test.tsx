// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState, type JSX } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox.js";

afterEach(() => {
  cleanup();
});

function ControlledCheckbox({
  initialChecked = false,
  onCheckedChange,
}: Readonly<{
  initialChecked?: boolean;
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
}>): JSX.Element {
  const [checked, setChecked] = useState<boolean | "indeterminate">(initialChecked);

  function handleCheckedChange(nextChecked: boolean | "indeterminate"): void {
    setChecked(nextChecked);
    onCheckedChange?.(nextChecked);
  }

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={handleCheckedChange}
      aria-label="Controlled option"
    />
  );
}

describe("Checkbox", () => {
  it("toggles on click", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<Checkbox aria-label="Subscribe" onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole("checkbox", { name: "Subscribe" });
    expect(checkbox).toHaveAttribute("aria-checked", "false");

    await user.click(checkbox);

    expect(checkbox).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("toggles on keyboard", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<Checkbox aria-label="Remember me" onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole("checkbox", { name: "Remember me" });
    checkbox.focus();

    await user.keyboard("{ }");

    expect(checkbox).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("emits checked state", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<ControlledCheckbox onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole("checkbox", { name: "Controlled option" });
    await user.click(checkbox);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <Checkbox aria-label="Locked" disabled onCheckedChange={onCheckedChange} />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Locked" });
    expect(checkbox).toBeDisabled();

    await user.click(checkbox);
    checkbox.focus();
    await user.keyboard("{ }");

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(checkbox).toHaveAttribute("aria-checked", "false");
  });

  it("forwards ref to the checkbox root", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Checkbox ref={ref} aria-label="Ref target" defaultChecked />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveAttribute("aria-checked", "true");
  });

  it("preserves caller className", () => {
    render(<Checkbox aria-label="Styled" className="custom-checkbox" />);

    expect(screen.getByRole("checkbox", { name: "Styled" })).toHaveClass("custom-checkbox");
  });

  it("applies aria-invalid when invalid", () => {
    render(<Checkbox aria-label="Consent" invalid />);

    expect(screen.getByRole("checkbox", { name: "Consent" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("protects controlled invalid and disabled attributes from native prop override", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <Checkbox
        aria-label="Protected"
        invalid
        disabled
        onCheckedChange={onCheckedChange}
        aria-invalid={false}
        data-invalid="false"
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Protected" });

    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAttribute("data-invalid", "true");

    await user.click(checkbox);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("renders indeterminate state", () => {
    render(<Checkbox aria-label="Partial selection" checked="indeterminate" />);

    expect(screen.getByRole("checkbox", { name: "Partial selection" })).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
  });
});

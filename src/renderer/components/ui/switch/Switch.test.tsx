// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Switch } from "./Switch.js";

afterEach(() => {
  cleanup();
});

describe("Switch", () => {
  it("has switch role", () => {
    render(<Switch aria-label="Notifications" />);

    expect(screen.getByRole("switch", { name: "Notifications" })).toBeInTheDocument();
  });

  it("toggles state on click", () => {
    render(<Switch aria-label="Auto answer" defaultChecked={false} />);

    const control = screen.getByRole("switch", { name: "Auto answer" });
    expect(control).toHaveAttribute("data-state", "unchecked");

    fireEvent.click(control);
    expect(control).toHaveAttribute("data-state", "checked");

    fireEvent.click(control);
    expect(control).toHaveAttribute("data-state", "unchecked");
  });

  it("emits checked value", () => {
    const onCheckedChange = vi.fn();

    render(
      <Switch aria-label="Headset mode" defaultChecked={false} onCheckedChange={onCheckedChange} />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Headset mode" }));

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", () => {
    const onCheckedChange = vi.fn();

    render(
      <Switch
        aria-label="Locked setting"
        disabled
        defaultChecked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    const control = screen.getByRole("switch", { name: "Locked setting" });
    expect(control).toBeDisabled();
    expect(control).toHaveAttribute("data-state", "unchecked");

    fireEvent.click(control);

    expect(control).toHaveAttribute("data-state", "unchecked");
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("forwards ref to the switch root", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Switch ref={ref} aria-label="Extension" defaultChecked />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveAttribute("data-state", "checked");
  });

  it("preserves caller className", () => {
    render(<Switch aria-label="Custom switch" className="custom-switch" />);

    expect(screen.getByRole("switch", { name: "Custom switch" })).toHaveClass("custom-switch");
  });

  it("protects controlled disabled attribute from native prop override", () => {
    const onCheckedChange = vi.fn();

    render(
      <Switch
        aria-label="Protected switch"
        disabled
        onCheckedChange={onCheckedChange}
        data-disabled={undefined}
      />,
    );

    const control = screen.getByRole("switch", { name: "Protected switch" });

    expect(control).toBeDisabled();

    fireEvent.click(control);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

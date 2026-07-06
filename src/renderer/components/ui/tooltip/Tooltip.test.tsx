// @vitest-environment jsdom
import type { JSX } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../button/Button.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "./Tooltip.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function BasicTooltip({
  disabled = false,
  label = "Helpful hint",
}: Readonly<{
  disabled?: boolean;
  label?: string;
}>): JSX.Element {
  return (
    <Tooltip label={label} side="top" delayDuration={0} disabled={disabled}>
      <Button variant="outline">Hover target</Button>
    </Tooltip>
  );
}

describe("Tooltip", () => {
  beforeEach(() => {
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("shows on hover", async () => {
    const user = userEvent.setup();

    render(<BasicTooltip />);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await user.hover(screen.getByRole("button", { name: "Hover target" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Helpful hint");
  });

  it("shows on focus", async () => {
    const user = userEvent.setup();

    render(<BasicTooltip />);

    await user.tab();

    expect(screen.getByRole("button", { name: "Hover target" })).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Helpful hint");
  });

  it("hides on escape", async () => {
    const user = userEvent.setup();

    render(<BasicTooltip />);

    await user.hover(screen.getByRole("button", { name: "Hover target" }));
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("does not render when disabled", async () => {
    const user = userEvent.setup();

    render(<BasicTooltip disabled={true} />);

    await user.hover(screen.getByRole("button", { name: "Hover target" }));

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("does not render when label is empty", async () => {
    const user = userEvent.setup();

    render(<BasicTooltip label="" />);

    await user.hover(screen.getByRole("button", { name: "Hover target" }));

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("preserves caller className on content", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip label="Custom surface" delayDuration={0} className="custom-tooltip-panel">
        <Button variant="ghost">Styled tooltip</Button>
      </Tooltip>,
    );

    await user.hover(screen.getByRole("button", { name: "Styled tooltip" }));

    const content = document.querySelector(".custom-tooltip-panel");
    expect(content).not.toBeNull();
    expect(content).toHaveClass("custom-tooltip-panel");
  });
});

describe("Tooltip composable primitives", () => {
  beforeEach(() => {
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("supports controlled open state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <TooltipRoot open={true} onOpenChange={onOpenChange}>
          <TooltipTrigger asChild>
            <Button variant="primary">Controlled</Button>
          </TooltipTrigger>
          <TooltipContent>Controlled tooltip</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );

    expect(screen.getByRole("tooltip")).toHaveTextContent("Controlled tooltip");

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

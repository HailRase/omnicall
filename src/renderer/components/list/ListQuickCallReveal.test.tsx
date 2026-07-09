// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListQuickCallReveal } from "./ListQuickCallReveal.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
    matches: query === "(hover: hover) and (pointer: fine)",
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

describe("ListQuickCallReveal", () => {
  it("hides call action until row interaction on hover-capable devices", () => {
    const onClick = vi.fn();

    render(
      <div data-testid="row">
        <ListQuickCallReveal
          visible={false}
          ariaLabel="Позвонить"
          testId="quick-call"
          onClick={onClick}
        />
      </div>,
    );

    const button = screen.getByTestId("quick-call");
    expect(button.closest("[aria-hidden='true']")).not.toBeNull();

    fireEvent.mouseEnter(screen.getByTestId("row"));
    render(
      <ListQuickCallReveal
        visible
        ariaLabel="Позвонить"
        testId="quick-call-visible"
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByTestId("quick-call-visible"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

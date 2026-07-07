// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShellDialpadPanel } from "./ShellDialpadPanel.js";

describe("ShellDialpadPanel", () => {
  beforeEach(() => {
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders placeholder when open and hides when closed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(
      <ShellDialpadPanel
        open={false}
        title="Contacts"
        testId="contacts-dialpad-panel"
        onClose={onClose}
      />,
    );

    expect(screen.queryByTestId("contacts-dialpad-panel")).not.toBeInTheDocument();

    rerender(
      <ShellDialpadPanel
        open
        title="Contacts"
        testId="contacts-dialpad-panel"
        onClose={onClose}
      />,
    );

    expect(screen.getByTestId("contacts-dialpad-panel")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-dialpad-panel-placeholder")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Contacts" })).toBeInTheDocument();

    await user.click(screen.getByTestId("contacts-dialpad-panel-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on Escape and renders expanded presentation", () => {
    const onClose = vi.fn();

    render(
      <ShellDialpadPanel
        open
        title="History"
        testId="history-dialpad-panel"
        presentation="fullPanel"
        onClose={onClose}
      >
        <p>Body</p>
      </ShellDialpadPanel>,
    );

    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByTestId("history-dialpad-panel")).toHaveAttribute(
      "data-shell-overlay-presentation",
      "fullPanel",
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders back navigation when requested", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <ShellDialpadPanel
        open
        title="Contact"
        testId="contact-dialpad-panel"
        showBack
        onClose={vi.fn()}
        onBack={onBack}
      />,
    );

    await user.click(screen.getByTestId("contact-dialpad-panel-back"));
    expect(onBack).toHaveBeenCalledOnce();
  });
});

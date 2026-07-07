// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShellOverlaySheet } from "./ShellOverlaySheet.js";

describe("ShellOverlaySheet", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders placeholder when open and hides when closed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(
      <ShellOverlaySheet
        open={false}
        title="Settings"
        testId="settings-overlay"
        onClose={onClose}
      />,
    );

    expect(screen.queryByTestId("settings-overlay")).not.toBeInTheDocument();

    rerender(
      <ShellOverlaySheet
        open
        title="Settings"
        testId="settings-overlay"
        onClose={onClose}
      />,
    );

    expect(screen.getByTestId("settings-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("settings-overlay-placeholder")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-overlay-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on Escape and renders full-panel presentation", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ShellOverlaySheet
        open
        title="History"
        testId="history-overlay"
        presentation="fullPanel"
        onClose={onClose}
      >
        <p>Body</p>
      </ShellOverlaySheet>,
    );

    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByTestId("history-overlay")).toHaveAttribute(
      "data-shell-overlay-presentation",
      "fullPanel",
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();

    await user.click(screen.getByLabelText("Закрыть панель"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("does not close sidebar overlays when clicking the transparent backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ShellOverlaySheet
        open
        title="Contacts"
        testId="contacts-overlay"
        presentation="sidebar"
        onClose={onClose}
      >
        <p>Contacts</p>
      </ShellOverlaySheet>,
    );

    const backdrop = screen.getByLabelText("Закрыть панель");
    expect(backdrop).toHaveAttribute("aria-hidden", "true");

    await user.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders back navigation when requested", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <ShellOverlaySheet
        open
        title="Contact"
        testId="contact-overlay"
        showBack
        onClose={vi.fn()}
        onBack={onBack}
      />,
    );

    await user.click(screen.getByTestId("contact-overlay-back"));
    expect(onBack).toHaveBeenCalledOnce();
  });
});

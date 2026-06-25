// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ShellOverlaySheet } from "./ShellOverlaySheet.js";

describe("ShellOverlaySheet", () => {
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
});

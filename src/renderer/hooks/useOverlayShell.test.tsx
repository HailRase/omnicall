// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import type { JSX } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useOverlayShell } from "./useOverlayShell.js";

function OverlayProbe(): JSX.Element {
  const overlay = useOverlayShell();

  return (
    <div>
      <button type="button" data-testid="open-settings" onClick={overlay.openSettings}>
        Open settings
      </button>
      <span data-testid="settings-open">{String(overlay.settingsOpen)}</span>
      <button type="button" data-testid="close-overlay" onClick={overlay.closeOverlay}>
        Close
      </button>
    </div>
  );
}

describe("useOverlayShell", () => {
  it("tracks settings overlay open state", async () => {
    const user = userEvent.setup();
    render(<OverlayProbe />);

    expect(screen.getByTestId("settings-open")).toHaveTextContent("false");

    await user.click(screen.getByTestId("open-settings"));
    expect(screen.getByTestId("settings-open")).toHaveTextContent("true");

    await user.click(screen.getByTestId("close-overlay"));
    expect(screen.getByTestId("settings-open")).toHaveTextContent("false");
  });
});

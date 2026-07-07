// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShellTitleBar } from "./ShellTitleBar.js";

afterEach(() => {
  cleanup();
});

const windowControls = {
  platform: "darwin" as const,
  showNativeWindowControls: true,
  isShuttingDown: false,
  onMinimize: vi.fn(),
  onClose: vi.fn(),
  onRestart: vi.fn(),
};

describe("ShellTitleBar", () => {
  it("hides window controls row when suppressWindowControls is true", () => {
    render(
      <ShellTitleBar
        windowControls={windowControls}
        suppressWindowControls
        leading={<span>Header content</span>}
      />,
    );

    expect(screen.getByTestId("shell-titlebar")).toBeInTheDocument();
    expect(screen.queryByTestId("shell-window-controls")).not.toBeInTheDocument();
    expect(screen.getByText("Header content")).toBeInTheDocument();
  });

  it("renders window controls row when suppressWindowControls is false", () => {
    render(
      <ShellTitleBar
        windowControls={windowControls}
        leading={<span>Header content</span>}
      />,
    );

    expect(screen.getByTestId("shell-window-controls")).toBeInTheDocument();
  });
});

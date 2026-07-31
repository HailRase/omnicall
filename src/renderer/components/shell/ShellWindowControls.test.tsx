// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShellWindowControls } from "./ShellWindowControls.js";

afterEach(() => {
  cleanup();
});

describe("ShellWindowControls", () => {
  it("renders macOS traffic lights with close, minimize, and restart", () => {
    render(
      <ShellWindowControls
        platform="darwin"
        showNativeWindowControls={true}
        isShuttingDown={false}
        onMinimize={vi.fn()}
        onClose={vi.fn()}
        onRestart={vi.fn()}
      />,
    );

    const controls = screen.getByTestId("shell-window-controls");
    const testIds = Array.from(
      controls.querySelectorAll('[data-testid^="control-window-"]'),
      (node) => node.getAttribute("data-testid"),
    );

    expect(testIds).toEqual([
      "control-window-close",
      "control-window-minimize",
      "control-window-restart",
    ]);
    expect(screen.getByLabelText("Закрыть приложение")).toBeInTheDocument();
    expect(screen.getByLabelText("Свернуть окно")).toBeInTheDocument();
    expect(screen.getByLabelText("Перезапустить приложение")).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders macOS maximize traffic light in settings mode with restart beside it", () => {
    render(
      <ShellWindowControls
        platform="darwin"
        showNativeWindowControls={true}
        isShuttingDown={false}
        maximizeEnabled={true}
        isMaximized={false}
        onMinimize={vi.fn()}
        onClose={vi.fn()}
        onRestart={vi.fn()}
        onToggleMaximize={vi.fn()}
      />,
    );

    const controls = screen.getByTestId("shell-window-controls");
    const testIds = Array.from(
      controls.querySelectorAll('[data-testid^="control-window-"]'),
      (node) => node.getAttribute("data-testid"),
    );

    expect(testIds).toEqual([
      "control-window-close",
      "control-window-minimize",
      "control-window-maximize",
      "control-window-restart",
    ]);
    expect(screen.getByLabelText("Развернуть на весь экран")).toBeInTheDocument();
  });

  it("renders minimize, maximize, restart, and close on frameless platforms in settings", () => {
    render(
      <ShellWindowControls
        platform="linux"
        showNativeWindowControls={true}
        isShuttingDown={false}
        maximizeEnabled={true}
        isMaximized={false}
        onMinimize={vi.fn()}
        onClose={vi.fn()}
        onRestart={vi.fn()}
        onToggleMaximize={vi.fn()}
      />,
    );

    const controls = screen.getByTestId("shell-window-controls");
    const testIds = Array.from(
      controls.querySelectorAll('[data-testid^="control-window-"]'),
      (node) => node.getAttribute("data-testid"),
    );

    expect(testIds).toEqual([
      "control-window-minimize",
      "control-window-maximize",
      "control-window-restart",
      "control-window-close",
    ]);
  });

  it("renders minimize, restart, and close on frameless platforms", () => {
    render(
      <ShellWindowControls
        platform="linux"
        showNativeWindowControls={true}
        isShuttingDown={false}
        onMinimize={vi.fn()}
        onClose={vi.fn()}
        onRestart={vi.fn()}
      />,
    );

    const controls = screen.getByTestId("shell-window-controls");
    const testIds = Array.from(
      controls.querySelectorAll('[data-testid^="control-window-"]'),
      (node) => node.getAttribute("data-testid"),
    );

    expect(testIds).toEqual([
      "control-window-minimize",
      "control-window-restart",
      "control-window-close",
    ]);
    expect(screen.getByLabelText("Свернуть окно")).toBeInTheDocument();
    expect(screen.getByLabelText("Перезапустить приложение")).toBeInTheDocument();
    expect(screen.getByLabelText("Закрыть приложение")).toBeInTheDocument();
  });

  it("disables controls while shutdown is in progress", () => {
    render(
      <ShellWindowControls
        platform="win32"
        showNativeWindowControls={true}
        isShuttingDown={true}
        maximizeEnabled={true}
        onMinimize={vi.fn()}
        onClose={vi.fn()}
        onRestart={vi.fn()}
        onToggleMaximize={vi.fn()}
      />,
    );

    expect(screen.getByTestId("control-window-minimize")).toBeDisabled();
    expect(screen.getByTestId("control-window-maximize")).toBeDisabled();
    expect(screen.getByTestId("control-window-restart")).toBeDisabled();
    expect(screen.getByTestId("control-window-close")).toBeDisabled();
  });

  it("disables macOS traffic lights while shutdown is in progress", () => {
    render(
      <ShellWindowControls
        platform="darwin"
        showNativeWindowControls={true}
        isShuttingDown={true}
        onMinimize={vi.fn()}
        onClose={vi.fn()}
        onRestart={vi.fn()}
      />,
    );

    expect(screen.getByTestId("control-window-close")).toBeDisabled();
    expect(screen.getByTestId("control-window-minimize")).toBeDisabled();
    expect(screen.getByTestId("control-window-restart")).toBeDisabled();
  });

  it("invokes restart callback on click", async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();

    render(
      <ShellWindowControls
        platform="darwin"
        showNativeWindowControls={true}
        isShuttingDown={false}
        onMinimize={vi.fn()}
        onClose={vi.fn()}
        onRestart={onRestart}
      />,
    );

    await user.click(screen.getByTestId("control-window-restart"));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it("invokes maximize toggle and shows restore label when maximized", async () => {
    const user = userEvent.setup();
    const onToggleMaximize = vi.fn();

    const { rerender } = render(
      <ShellWindowControls
        platform="win32"
        showNativeWindowControls={true}
        isShuttingDown={false}
        maximizeEnabled={true}
        isMaximized={false}
        onMinimize={vi.fn()}
        onClose={vi.fn()}
        onRestart={vi.fn()}
        onToggleMaximize={onToggleMaximize}
      />,
    );

    await user.click(screen.getByTestId("control-window-maximize"));
    expect(onToggleMaximize).toHaveBeenCalledTimes(1);

    rerender(
      <ShellWindowControls
        platform="win32"
        showNativeWindowControls={true}
        isShuttingDown={false}
        maximizeEnabled={true}
        isMaximized={true}
        onMinimize={vi.fn()}
        onClose={vi.fn()}
        onRestart={vi.fn()}
        onToggleMaximize={onToggleMaximize}
      />,
    );

    expect(screen.getByLabelText("Восстановить размер окна настроек")).toBeInTheDocument();
  });
});

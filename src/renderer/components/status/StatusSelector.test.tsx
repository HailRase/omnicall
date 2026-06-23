// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatusSelector } from "./StatusSelector.js";

afterEach(() => {
  cleanup();
});

describe("StatusSelector", () => {
  it("is hidden when not visible (SIP-only)", () => {
    renderSelector({ visible: false });

    expect(screen.queryByTestId("status-selector")).not.toBeInTheDocument();
  });

  it("renders status controls with required test IDs in OCP mode", () => {
    renderSelector({ visible: true, currentStatus: "ready" });

    expect(screen.getByTestId("status-selector")).toBeInTheDocument();
    expect(screen.getByTestId("control-change-ready")).toBeInTheDocument();
    expect(screen.getByTestId("control-change-break")).toBeInTheDocument();
    expect(screen.getByLabelText("Operator status")).toBeInTheDocument();
  });

  it("shows in-progress indicator when status change is pending", () => {
    renderSelector({ statusChangeInProgress: true, pendingStatus: "break" });

    const indicator = screen.getByTestId("status-change-in-progress");
    expect(indicator).toHaveAttribute("role", "status");
    expect(indicator).toHaveTextContent("Status change in progress");
  });

  it("shows rejection banner from last rejection reason", () => {
    renderSelector({
      rejectionBanner: "Operator platform rejected the status change.",
    });

    const banner = screen.getByTestId("status-rejection-banner");
    expect(banner).toHaveAttribute("role", "alert");
    expect(banner).toHaveTextContent("Operator platform rejected");
  });

  it("disables controls when projection supplies disabled reasons", () => {
    renderSelector({
      readyDisabledReason: "dnd_blocks_ready",
      breakDisabledReason: "status_change_in_progress",
    });

    expect(screen.getByTestId("control-change-ready")).toBeDisabled();
    expect(screen.getByTestId("control-change-break")).toBeDisabled();
  });

  it("surfaces disabled reason label", () => {
    renderSelector({ readyDisabledReason: "dnd_blocks_ready" });

    expect(screen.getByTestId("status-disabled-reason")).toHaveTextContent(
      "Ready unavailable while DND",
    );
  });

  it("invokes ready callback when enabled", () => {
    const onReady = vi.fn();
    renderSelector({ onReady });

    fireEvent.click(screen.getByTestId("control-change-ready"));
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("invokes break callback when enabled", () => {
    const onBreak = vi.fn();
    renderSelector({ onBreak });

    fireEvent.click(screen.getByTestId("control-change-break"));
    expect(onBreak).toHaveBeenCalledTimes(1);
  });
});

type StatusSelectorOverrides = Partial<Parameters<typeof StatusSelector>[0]>;

function renderSelector(overrides: StatusSelectorOverrides = {}): void {
  const props: Parameters<typeof StatusSelector>[0] = {
    visible: true,
    currentStatus: "break",
    pendingStatus: null,
    statusChangeInProgress: false,
    readyDisabledReason: null,
    breakDisabledReason: null,
    rejectionBanner: null,
    breakReasonPickerVisible: false,
    breakReasons: ["meeting", "training"],
    selectedBreakReason: null,
    onReady: vi.fn(),
    onBreak: vi.fn(),
    onSelectBreakReason: vi.fn(),
    onConfirmBreak: vi.fn(),
    onOpenLogout: vi.fn(),
    ...overrides,
  };

  render(<StatusSelector {...props} />);
}

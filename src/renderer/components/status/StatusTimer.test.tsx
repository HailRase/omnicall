// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatusTimer } from "./StatusTimer.js";

vi.mock("../../hooks/useOperatorStatusTimer.js", () => ({
  useOperatorStatusTimer: () => ({
    durationSeconds: 125,
    formattedDuration: "2:05",
  }),
}));

afterEach(() => {
  cleanup();
});

describe("StatusTimer", () => {
  it("renders formatted duration when status is active", () => {
    render(
      <StatusTimer
        statusChangedAt="2026-06-23T10:00:00.000Z"
        timerRunning
        currentStatus="ready"
      />,
    );

    const timer = screen.getByTestId("status-timer");
    expect(timer).toHaveTextContent("2:05");
    expect(timer).toHaveAttribute("role", "status");
  });

  it("is hidden when no current status", () => {
    render(
      <StatusTimer
        statusChangedAt="2026-06-23T10:00:00.000Z"
        timerRunning
        currentStatus={null}
      />,
    );

    expect(screen.queryByTestId("status-timer")).not.toBeInTheDocument();
  });
});

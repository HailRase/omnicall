// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CallLineCardViewModel } from "@application/index.js";
import { CallSessionCard } from "./CallSessionCard.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const line: CallLineCardViewModel = {
  callId: "call-1",
  role: "primary",
  state: "Active",
  muted: true,
  isActiveUnheld: true,
  displayName: "+12025550100",
  statusLabel: "На линии",
  durationStartedAt: Date.now() - 65_000,
  queueLabelState: "ready",
  queueName: "Продажи",
  primaryAction: "hangup",
  showIconRow: true,
  resumeDisabledReason: null,
  hangupDisabledReason: null,
  holdDisabledReason: null,
  muteDisabledReason: null,
  unmuteDisabledReason: null,
  transferDisabledReason: null,
};

describe("CallSessionCard", () => {
  it("marks selected full card with accent border when selection chrome is enabled", () => {
    const onClick = vi.fn();
    render(
      <CallSessionCard
        line={line}
        isActive
        showSelectionChrome
        onClick={onClick}
      />,
    );

    const card = screen.getByRole("button", { name: "Выбрать звонок +12025550100" });
    expect(card.className).toMatch(/cardSelected/);
    expect(card).toHaveAttribute("aria-selected", "true");
  });

  it("omits selection chrome for lone full card without competing sessions", () => {
    render(<CallSessionCard line={line} isActive />);

    const card = screen.getByTestId("call-session-card-call-1");
    expect(card.tagName).toBe("ARTICLE");
    expect(card.className).not.toMatch(/cardSelected/);
  });

  it("invokes onClick for selectable full card", () => {
    const onClick = vi.fn();
    render(
      <CallSessionCard
        line={line}
        isActive
        showSelectionChrome
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Выбрать звонок +12025550100" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toHaveAttribute("aria-selected", "true");
  });

  it("renders full card with status and mute badge", () => {
    render(<CallSessionCard line={line} isActive />);

    expect(screen.getByTestId("call-session-card-call-1")).toBeInTheDocument();
    expect(screen.getByTestId("call-session-status-call-1")).toHaveTextContent("На линии");
    expect(screen.getByTestId("call-session-muted-call-1")).toHaveTextContent("Микрофон выкл");
    expect(screen.getByText("Продажи")).toBeInTheDocument();
  });

  it("renders compact held status without resume hint", () => {
    render(
      <CallSessionCard
        line={{
          ...line,
          state: "Held",
          isActiveUnheld: false,
          statusLabel: "На удержании",
          muted: false,
        }}
        compact
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId("call-session-status-call-1")).toHaveTextContent("На удержании");
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Выбрать звонок +12025550100, на удержании",
    );
  });

  it("marks selected held compact card", () => {
    render(
      <CallSessionCard
        line={{
          ...line,
          state: "Held",
          isActiveUnheld: false,
          statusLabel: "На удержании",
          muted: false,
        }}
        compact
        isActive
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId("call-session-status-call-1")).toHaveTextContent(
      "На удержании · выбран",
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-selected", "true");
  });
});

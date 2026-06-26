// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CallLineCardViewModel } from "@application/index.js";
import { CallSessionTab } from "./CallSessionTab.js";
import { CallSessionTabs } from "./CallSessionTabs.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const activeLine: CallLineCardViewModel = {
  callId: "call-1",
  role: "primary",
  state: "Active",
  muted: true,
  isActiveUnheld: true,
  displayName: "+12025550100",
  statusLabel: "На линии",
  durationStartedAt: Date.now() - 65_000,
  queueLabelState: "hidden",
  queueName: null,
  primaryAction: "hangup",
  showIconRow: true,
  resumeDisabledReason: null,
  hangupDisabledReason: null,
  holdDisabledReason: null,
  muteDisabledReason: null,
  unmuteDisabledReason: null,
  transferDisabledReason: null,
};

describe("CallSessionTab", () => {
  it("renders number, duration, and mute icon for active line", () => {
    render(
      <CallSessionTab line={activeLine} selected onSelect={vi.fn()} />,
    );

    expect(screen.getByTestId("call-session-number-call-1")).toHaveTextContent(
      "+12025550100",
    );
    expect(screen.getByTestId("call-session-duration-call-1")).toHaveTextContent("1:05");
    expect(screen.getByTestId("call-session-muted-call-1")).toBeInTheDocument();
  });

  it("shows hold badge for held line", () => {
    render(
      <CallSessionTab
        line={{
          ...activeLine,
          state: "Held",
          isActiveUnheld: false,
          statusLabel: "На удержании",
          muted: false,
        }}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId("call-session-hold-call-1")).toHaveTextContent("Удерж.");
  });

  it("invokes onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(
      <CallSessionTab line={activeLine} selected onSelect={onSelect} />,
    );

    fireEvent.click(screen.getByTestId("call-session-tab-call-1"));
    expect(onSelect).toHaveBeenCalledWith("call-1");
  });
});

describe("CallSessionTabs", () => {
  it("renders tablist when lines are visible", () => {
    render(
      <CallSessionTabs
        shell={{ visible: true, lines: [activeLine], policyErrorMessage: null }}
        onSelectLine={vi.fn()}
      />,
    );

    expect(screen.getByTestId("call-session-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("call-session-tab-call-1")).toBeInTheDocument();
  });

  it("returns null when shell is not visible", () => {
    const { container } = render(
      <CallSessionTabs
        shell={{ visible: false, lines: [], policyErrorMessage: null }}
        onSelectLine={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

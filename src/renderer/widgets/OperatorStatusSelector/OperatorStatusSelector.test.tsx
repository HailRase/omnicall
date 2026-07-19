// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OperatorStatus,
  initialOcpReasonsProjection,
  initialOcpSessionProjection,
  initialOperatorStatusProjection,
} from "@application/index.js";
import type { OperatorStatusSelectorVm } from "../../hooks/useOperatorStatusSelector.js";
import { OperatorStatusSelector } from "./OperatorStatusSelector.js";

vi.mock("../../i18n/index.js", () => ({
  useI18n: () => ({
    t: (key: string, params?: Readonly<Record<string, string | number>>) => {
      if (key === "ocp.status.selector.aria" && params !== undefined) {
        return `Operator status: ${String(params["status"])}`;
      }
      if (key === "ocp.status.timer.aria" && params !== undefined) {
        return `In status for ${String(params["elapsed"])}`;
      }
      return key;
    },
  }),
}));

afterEach(() => {
  cleanup();
});

function buildVm(
  overrides: Partial<OperatorStatusSelectorVm> = {},
): OperatorStatusSelectorVm {
  return {
    isAuthenticated: true,
    statusColor: "var(--color-status-online)",
    reasonLabel: "Ready for calls",
    allowStatusLabelFallback: false,
    statusLabelKey: "ocp.operatorStatus.ready",
    timerSince: Date.now() - 65_000,
    isDropdownDisabled: false,
    dropdownDisabledReasonKey: null,
    readyItems: [
      {
        reasonId: 1,
        label: "Ready for calls",
        targetStatus: "ready",
        disabled: false,
        disabledReasonKey: null,
        testId: null,
        isCurrent: true,
      },
    ],
    breakItems: [
      {
        reasonId: 2,
        label: "Lunch",
        targetStatus: "break",
        disabled: false,
        disabledReasonKey: null,
        testId: null,
        isCurrent: false,
      },
    ],
    isReconnecting: false,
    isFailed: false,
    reconnectAttempt: 0,
    maxReconnectAttempts: 6,
    ...overrides,
  };
}

describe("OperatorStatusSelector", () => {
  it("renders nothing when not authenticated", () => {
    const { container } = render(
      <OperatorStatusSelector
        vm={buildVm({ isAuthenticated: false })}
        onSelectReason={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("ocp-status-selector")).not.toBeInTheDocument();
  });

  it("shows status label and timer when authenticated", () => {
    render(
      <OperatorStatusSelector vm={buildVm()} onSelectReason={vi.fn()} />,
    );
    expect(screen.getByTestId("ocp-status-selector")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-status-label")).toHaveTextContent(
      "Ready for calls",
    );
    expect(screen.getByTestId("ocp-status-timer")).toHaveTextContent("00:01:05");
  });

  it("prefers reason label over status key when both are present", () => {
    render(
      <OperatorStatusSelector
        vm={buildVm({
          statusLabelKey: "ocp.operatorStatus.ringing",
          reasonLabel: "Доступен",
          allowStatusLabelFallback: false,
        })}
        onSelectReason={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ocp-status-label")).toHaveTextContent("Доступен");
    expect(screen.getByTestId("ocp-status-label")).not.toHaveTextContent(
      "ocp.operatorStatus.ringing",
    );
  });

  it("falls back to status key for system call statuses", () => {
    render(
      <OperatorStatusSelector
        vm={buildVm({
          statusLabelKey: "ocp.operatorStatus.talking",
          reasonLabel: "",
          allowStatusLabelFallback: true,
        })}
        onSelectReason={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ocp-status-label")).toHaveTextContent(
      "ocp.operatorStatus.talking",
    );
  });

  it("disables trigger when dropdown is disabled", () => {
    render(
      <OperatorStatusSelector
        vm={buildVm({
          isDropdownDisabled: true,
          dropdownDisabledReasonKey: "ocp.dropdown.disabledBusy",
          statusLabelKey: "ocp.operatorStatus.talking",
          reasonLabel: "Доступен",
        })}
        onSelectReason={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ocp-status-selector")).toBeDisabled();
  });

  it("exposes truncated status name via IconTooltip host", () => {
    const scrollSpy = vi
      .spyOn(HTMLElement.prototype, "scrollWidth", "get")
      .mockReturnValue(240);
    const clientSpy = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(80);

    render(
      <OperatorStatusSelector
        vm={buildVm({
          reasonLabel: "Very long operator status reason that should truncate",
        })}
        onSelectReason={vi.fn()}
      />,
    );

    expect(screen.getByTestId("icon-tooltip-host")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-status-label")).toHaveTextContent(
      "Very long operator status reason that should truncate",
    );

    scrollSpy.mockRestore();
    clientSpy.mockRestore();
  });

  it("keeps label slot constrained so long status cannot widen the shell", () => {
    render(
      <OperatorStatusSelector
        vm={buildVm({
          reasonLabel: "Очень длинный статус оператора который не должен расширять окно",
        })}
        onSelectReason={vi.fn()}
      />,
    );

    const label = screen.getByTestId("ocp-status-label");
    const tooltipOrSlot = label.parentElement;
    const labelSlot = tooltipOrSlot?.parentElement;

    expect(screen.getByTestId("ocp-status-selector-root")).toBeInTheDocument();
    expect(labelSlot?.className ?? "").toMatch(/labelSlot/);
    expect(label.className).toMatch(/label/);
  });
});

describe("operator status projection fixtures", () => {
  it("keeps serializable initial projections for SDK handoff", () => {
    expect(initialOcpSessionProjection().isAuthenticated).toBe(false);
    expect(initialOperatorStatusProjection().status).toBeNull();
    expect(initialOcpReasonsProjection().readyReasons).toEqual([]);
    expect(OperatorStatus.READY).toBe(1);
  });
});

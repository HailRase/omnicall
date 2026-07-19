// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  OcpStatusDropdownItemVm,
  PostCallFinishAppealVm,
} from "../../../hooks/useOperatorStatusSelector.js";
import {
  OCP_STATUS_BREAK_VISIBLE_COUNT,
  OcpStatusDropdown,
} from "./OcpStatusDropdown.js";

vi.mock("../../../i18n/index.js", () => ({
  useI18n: () => ({
    t: (key: string, params?: Readonly<Record<string, string | number>>) => {
      if (key === "ocp.postCall.finishAppeal" && params !== undefined) {
        return `Finish contact: ${String(params["status"])}`;
      }
      if (key === "ocp.operatorStatus.ready") {
        return "Available";
      }
      return key;
    },
  }),
}));

afterEach(() => {
  cleanup();
});

const HIDDEN_FINISH_APPEAL: PostCallFinishAppealVm = {
  visible: false,
  statusLabel: "",
  submitting: false,
  disabled: false,
  disabledReasonKey: null,
};

function buildItem(
  reasonId: number,
  label: string,
  targetStatus: "ready" | "break",
  overrides: Partial<OcpStatusDropdownItemVm> = {},
): OcpStatusDropdownItemVm {
  return {
    reasonId,
    label,
    targetStatus,
    disabled: false,
    disabledReasonKey: null,
    testId: null,
    isCurrent: false,
    ...overrides,
  };
}

describe("OcpStatusDropdown", () => {
  it("keeps Ready pinned and marks Break list as scrollable with max 5 visible", async () => {
    const user = userEvent.setup();
    const breakItems = Array.from({ length: 8 }, (_, index) =>
      buildItem(100 + index, `Break ${index + 1}`, "break"),
    );

    render(
      <OcpStatusDropdown
        disabled={false}
        disabledReasonKey={null}
        readyItems={[buildItem(1, "Доступен", "ready")]}
        breakItems={breakItems}
        finishAppeal={HIDDEN_FINISH_APPEAL}
        trigger={
          <button type="button" data-testid="ocp-status-dropdown-trigger">
            Open
          </button>
        }
        onSelectReason={vi.fn()}
        onFinishAppeal={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("ocp-status-dropdown-trigger"));

    const readyGroup = screen.getByTestId("ocp-status-dropdown-ready");
    const breakGroup = screen.getByTestId("ocp-status-dropdown-breaks");

    expect(readyGroup).toHaveTextContent("Доступен");
    expect(breakGroup).toHaveAttribute(
      "data-visible-count",
      String(OCP_STATUS_BREAK_VISIBLE_COUNT),
    );
    expect(breakGroup.className).toMatch(/breakGroup/);
    expect(breakGroup).toHaveTextContent("Break 1");
    expect(breakGroup).toHaveTextContent("Break 8");
    expect(OCP_STATUS_BREAK_VISIBLE_COUNT).toBe(5);
  });

  it("marks current Ready as non-selectable with current styling hooks", async () => {
    const user = userEvent.setup();
    const onSelectReason = vi.fn();

    render(
      <OcpStatusDropdown
        disabled={false}
        disabledReasonKey={null}
        readyItems={[
          buildItem(1, "Доступен", "ready", {
            isCurrent: true,
            testId: "ocp-ready-current",
          }),
        ]}
        breakItems={[buildItem(7, "Обед", "break")]}
        finishAppeal={HIDDEN_FINISH_APPEAL}
        trigger={
          <button type="button" data-testid="ocp-status-dropdown-trigger">
            Open
          </button>
        }
        onSelectReason={onSelectReason}
        onFinishAppeal={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("ocp-status-dropdown-trigger"));

    const current = screen.getByTestId("ocp-ready-current");
    expect(current).toHaveAttribute("aria-current", "true");
    expect(current).toHaveAttribute("data-current", "true");
    expect(current).toHaveAttribute("aria-disabled", "true");
    expect(current).toHaveAttribute("data-disabled");
    expect(current.className).toMatch(/optionReady/);
    expect(current.className).toMatch(/optionCurrent/);

    await user.click(current);
    expect(onSelectReason).not.toHaveBeenCalled();
  });

  it("marks current Break as non-selectable with break current styling hooks", async () => {
    const user = userEvent.setup();
    const onSelectReason = vi.fn();

    render(
      <OcpStatusDropdown
        disabled={false}
        disabledReasonKey={null}
        readyItems={[buildItem(1, "Доступен", "ready")]}
        breakItems={[
          buildItem(7, "Обед", "break", {
            isCurrent: true,
            testId: "ocp-break-current",
          }),
        ]}
        finishAppeal={HIDDEN_FINISH_APPEAL}
        trigger={
          <button type="button" data-testid="ocp-status-dropdown-trigger">
            Open
          </button>
        }
        onSelectReason={onSelectReason}
        onFinishAppeal={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("ocp-status-dropdown-trigger"));

    const current = screen.getByTestId("ocp-break-current");
    expect(current).toHaveAttribute("aria-current", "true");
    expect(current).toHaveAttribute("data-current", "true");
    expect(current).toHaveAttribute("aria-disabled", "true");
    expect(current).toHaveAttribute("data-disabled");
    expect(current.className).toMatch(/optionBreak/);
    expect(current.className).toMatch(/optionCurrent/);

    await user.click(current);
    expect(onSelectReason).not.toHaveBeenCalled();
  });

  it("shows finish-appeal footer during post-call and invokes callback", async () => {
    const user = userEvent.setup();
    const onFinishAppeal = vi.fn();

    render(
      <OcpStatusDropdown
        disabled={false}
        disabledReasonKey={null}
        readyItems={[buildItem(1, "Доступен", "ready")]}
        breakItems={[buildItem(7, "Обед", "break")]}
        finishAppeal={{
          visible: true,
          statusLabel: "Обед",
          submitting: false,
          disabled: false,
          disabledReasonKey: null,
        }}
        trigger={
          <button type="button" data-testid="ocp-status-dropdown-trigger">
            Open
          </button>
        }
        onSelectReason={vi.fn()}
        onFinishAppeal={onFinishAppeal}
      />,
    );

    await user.click(screen.getByTestId("ocp-status-dropdown-trigger"));
    expect(screen.getByTestId("ocp-post-call-finish-footer")).toBeInTheDocument();
    await user.click(screen.getByTestId("ocp-post-call-finish-appeal"));
    expect(onFinishAppeal).toHaveBeenCalledTimes(1);
  });
});

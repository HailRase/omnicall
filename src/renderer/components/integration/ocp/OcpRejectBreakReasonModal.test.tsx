// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OcpRejectBreakReasonModal } from "./OcpRejectBreakReasonModal.js";

describe("OcpRejectBreakReasonModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("hides when closed", () => {
    render(
      <OcpRejectBreakReasonModal
        open={false}
        reasons={[{ id: 7, label: "Coffee" }]}
        selectedReasonId={null}
        submitting={false}
        onSelectReason={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("ocp-reject-break-modal")).not.toBeInTheDocument();
  });

  it("keeps confirm disabled until a reason is selected", async () => {
    const user = userEvent.setup();
    const onSelectReason = vi.fn();
    const onConfirm = vi.fn();

    const { rerender } = render(
      <OcpRejectBreakReasonModal
        open
        reasons={[
          { id: 7, label: "Coffee" },
          { id: 8, label: "Lunch" },
        ]}
        selectedReasonId={null}
        submitting={false}
        onSelectReason={onSelectReason}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ocp-reject-break-confirm")).toBeDisabled();

    await user.click(screen.getByTestId("ocp-reject-break-reason-7"));
    expect(onSelectReason).toHaveBeenCalledWith(7);

    rerender(
      <OcpRejectBreakReasonModal
        open
        reasons={[
          { id: 7, label: "Coffee" },
          { id: 8, label: "Lunch" },
        ]}
        selectedReasonId={7}
        submitting={false}
        onSelectReason={onSelectReason}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ocp-reject-break-confirm")).toBeEnabled();
    await user.click(screen.getByTestId("ocp-reject-break-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when no reasons exist", () => {
    render(
      <OcpRejectBreakReasonModal
        open
        reasons={[]}
        selectedReasonId={null}
        submitting={false}
        onSelectReason={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ocp-reject-break-empty")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-reject-break-confirm")).toBeDisabled();
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OcpLogoutReasonModal } from "./OcpLogoutReasonModal.js";

describe("OcpLogoutReasonModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("hides when closed", () => {
    render(
      <OcpLogoutReasonModal
        open={false}
        reasons={[{ id: 9, label: "End of shift" }]}
        selectedReasonId={null}
        submitting={false}
        onSelectReason={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("ocp-logout-reasons-modal")).not.toBeInTheDocument();
  });

  it("keeps confirm disabled until a reason is selected", async () => {
    const user = userEvent.setup();
    const onSelectReason = vi.fn();
    const onConfirm = vi.fn();

    const { rerender } = render(
      <OcpLogoutReasonModal
        open
        reasons={[
          { id: 9, label: "End of shift" },
          { id: 10, label: "Break over" },
        ]}
        selectedReasonId={null}
        submitting={false}
        onSelectReason={onSelectReason}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ocp-logout-confirm")).toBeDisabled();
    expect(screen.getByTestId("ocp-logout-reasons-modal")).toHaveAttribute(
      "data-shell-overlay-presentation",
      "sidebar",
    );

    await user.click(screen.getByTestId("ocp-logout-reason-9"));
    expect(onSelectReason).toHaveBeenCalledWith(9);

    rerender(
      <OcpLogoutReasonModal
        open
        reasons={[
          { id: 9, label: "End of shift" },
          { id: 10, label: "Break over" },
        ]}
        selectedReasonId={9}
        submitting={false}
        onSelectReason={onSelectReason}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ocp-logout-confirm")).toBeEnabled();
    await user.click(screen.getByTestId("ocp-logout-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when no reasons exist", () => {
    render(
      <OcpLogoutReasonModal
        open
        reasons={[]}
        selectedReasonId={null}
        submitting={false}
        onSelectReason={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ocp-logout-reasons-empty")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-logout-confirm")).toBeDisabled();
  });

  it("allows confirm without reason when requireReasonSelection is false", () => {
    render(
      <OcpLogoutReasonModal
        open
        reasons={[]}
        selectedReasonId={null}
        submitting={false}
        requireReasonSelection={false}
        onSelectReason={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ocp-logout-confirm")).toBeEnabled();
  });

  it("keeps footer actions right-aligned", () => {
    const { container } = render(
      <OcpLogoutReasonModal
        open
        reasons={[{ id: 9, label: "End of shift" }]}
        selectedReasonId={9}
        submitting={false}
        onSelectReason={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(screen.getByTestId("ocp-logout-cancel-action")).toBeInTheDocument();
    expect(screen.getByTestId("ocp-logout-confirm")).toBeInTheDocument();
  });
});

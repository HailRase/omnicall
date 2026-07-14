// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OcpPostCallStatusModal } from "./OcpPostCallStatusModal.js";

vi.mock("../../../i18n/index.js", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

afterEach(() => {
  cleanup();
});

describe("OcpPostCallStatusModal", () => {
  it("shows pending status and action choices in one step", () => {
    const onChooseFinish = vi.fn();
    const onChooseReserve = vi.fn();
    render(
      <OcpPostCallStatusModal
        open
        pendingReasonLabel="Toilet break"
        chosenAction={null}
        submitting={false}
        onChooseFinish={onChooseFinish}
        onChooseReserve={onChooseReserve}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ocp-post-call-pending-reason")).toHaveTextContent(
      "Toilet break",
    );
    expect(screen.getByTestId("ocp-post-call-confirm")).toBeDisabled();
    fireEvent.click(screen.getByTestId("ocp-post-call-choose-finish"));
    expect(onChooseFinish).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("ocp-post-call-choose-reserve"));
    expect(onChooseReserve).toHaveBeenCalledTimes(1);
  });

  it("enables confirm when action is selected and has no close button", () => {
    const onConfirm = vi.fn();
    render(
      <OcpPostCallStatusModal
        open
        pendingReasonLabel="Toilet break"
        chosenAction="finish"
        submitting={false}
        onChooseFinish={vi.fn()}
        onChooseReserve={vi.fn()}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "common.close" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("ocp-post-call-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

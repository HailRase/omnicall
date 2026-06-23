// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LogoutReasonModal } from "./LogoutReasonModal.js";

afterEach(() => {
  cleanup();
});

describe("LogoutReasonModal", () => {
  it("is hidden when closed", () => {
    renderModal({ open: false });

    expect(screen.queryByTestId("logout-reason-modal")).not.toBeInTheDocument();
  });

  it("submits logout with selected reason", () => {
    const onSubmit = vi.fn();
    renderModal({
      onSubmit,
      selectedReason: "meeting",
    });

    fireEvent.click(screen.getByTestId("control-logout-submit"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables submit when reason required but not selected", () => {
    renderModal({ reasonRequired: true, selectedReason: null });

    expect(screen.getByTestId("control-logout-submit")).toBeDisabled();
  });

  it("closes on cancel without rejection banner semantics", () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByTestId("control-logout-cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

type LogoutModalOverrides = Partial<Parameters<typeof LogoutReasonModal>[0]>;

function renderModal(overrides: LogoutModalOverrides = {}): void {
  const props: Parameters<typeof LogoutReasonModal>[0] = {
    open: true,
    reasons: ["meeting", "training"],
    reasonRequired: true,
    selectedReason: null,
    onSelectReason: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };

  render(<LogoutReasonModal {...props} />);
}

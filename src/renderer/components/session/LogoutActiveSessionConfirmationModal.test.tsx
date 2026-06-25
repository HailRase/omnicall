// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LogoutActiveSessionConfirmationModal } from "./LogoutActiveSessionConfirmationModal.js";

afterEach(() => {
  cleanup();
});

describe("LogoutActiveSessionConfirmationModal", () => {
  it("renders confirmation copy when open", () => {
    render(
      <LogoutActiveSessionConfirmationModal
        open
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("logout-active-session-modal")).toBeInTheDocument();
    expect(screen.getByText(/активный звонок/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <LogoutActiveSessionConfirmationModal
        open={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("logout-active-session-modal")).not.toBeInTheDocument();
  });

  it("calls confirm and cancel handlers", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <LogoutActiveSessionConfirmationModal
        open
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByTestId("control-logout-confirm"));
    fireEvent.click(screen.getByTestId("control-logout-cancel"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CallIdleEmptyState } from "./CallIdleEmptyState.js";

afterEach(() => {
  cleanup();
});

describe("CallIdleEmptyState", () => {
  it("renders idle guidance copy when registered", () => {
    render(<CallIdleEmptyState />);
    expect(screen.getByTestId("call-idle-empty-state")).toHaveAttribute(
      "data-state",
      "ready",
    );
    expect(
      screen.getByText(/Введите номер или дождитесь входящего звонка/),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("call-idle-sign-in-cta")).not.toBeInTheDocument();
  });

  it("renders sign-in CTA when needsSignIn and onSignIn are provided", () => {
    const onSignIn = vi.fn();
    render(<CallIdleEmptyState needsSignIn onSignIn={onSignIn} />);

    expect(screen.getByTestId("call-idle-empty-state")).toHaveAttribute(
      "data-state",
      "needs-sign-in",
    );
    expect(
      screen.getByText(/Чтобы звонить, войдите в аккаунт/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("call-idle-sign-in-cta"));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("does not show CTA when needsSignIn is set without handler", () => {
    render(<CallIdleEmptyState needsSignIn />);
    expect(screen.queryByTestId("call-idle-sign-in-cta")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Введите номер или дождитесь входящего звонка/),
    ).toBeInTheDocument();
  });
});

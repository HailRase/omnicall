// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRendererLanguage } from "../../i18n/index.js";
import { SwitchSavedAccountProfileConfirmationModal } from "./SwitchSavedAccountProfileConfirmationModal.js";

afterEach(() => {
  cleanup();
  setRendererLanguage("ru");
});

describe("SwitchSavedAccountProfileConfirmationModal", () => {
  beforeEach(() => {
    setRendererLanguage("ru");
  });

  it("renders localized confirmation copy with from/to logins when open", () => {
    render(
      <SwitchSavedAccountProfileConfirmationModal
        open
        fromLogin="1001"
        toLogin="1002"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("switch-saved-account-profile-modal")).toBeInTheDocument();
    expect(screen.getByText("Сменить профиль?")).toBeInTheDocument();
    expect(
      screen.getByText("Вы уверены, что хотите сменить профиль с 1001 на 1002?"),
    ).toBeInTheDocument();
  });

  it("invokes confirm and cancel callbacks", () => {
    setRendererLanguage("en");
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <SwitchSavedAccountProfileConfirmationModal
        open
        fromLogin="alice"
        toLogin="bob"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByTestId("switch-saved-account-profile-confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByTestId("switch-saved-account-profile-cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

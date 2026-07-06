// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRendererLanguage } from "../../i18n/index.js";
import { DeleteSavedAccountProfileConfirmationModal } from "./DeleteSavedAccountProfileConfirmationModal.js";

afterEach(() => {
  cleanup();
  setRendererLanguage("ru");
});

describe("DeleteSavedAccountProfileConfirmationModal", () => {
  beforeEach(() => {
    setRendererLanguage("ru");
  });

  it("renders localized confirmation copy when open", () => {
    render(
      <DeleteSavedAccountProfileConfirmationModal
        open
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("delete-saved-account-profile-modal")).toBeInTheDocument();
    expect(screen.getByText("Удалить профиль?")).toBeInTheDocument();
  });

  it("invokes confirm and cancel callbacks", () => {
    setRendererLanguage("en");
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <DeleteSavedAccountProfileConfirmationModal
        open
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByTestId("delete-saved-account-profile-confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByTestId("delete-saved-account-profile-cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRendererLanguage } from "../../i18n/index.js";
import { setupJsdomRadix } from "../../test/setupJsdomRadix.js";
import { DeleteSavedAccountProfileConfirmationModal } from "./DeleteSavedAccountProfileConfirmationModal.js";

afterEach(() => {
  cleanup();
  setRendererLanguage("ru");
});

describe("DeleteSavedAccountProfileConfirmationModal", () => {
  beforeEach(() => {
    setupJsdomRadix();
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
    expect(screen.getByText("Отмена")).toBeInTheDocument();
    expect(screen.getByText("Удалить")).toBeInTheDocument();
  });

  it("invokes confirm callback", async () => {
    setRendererLanguage("en");
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <DeleteSavedAccountProfileConfirmationModal
        open
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByTestId("delete-saved-account-profile-confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("invokes cancel callback", async () => {
    setRendererLanguage("en");
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <DeleteSavedAccountProfileConfirmationModal
        open
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByTestId("delete-saved-account-profile-cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

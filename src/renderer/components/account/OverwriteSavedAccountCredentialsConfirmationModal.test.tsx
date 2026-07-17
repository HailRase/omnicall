// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRendererLanguage } from "../../i18n/index.js";
import { setupJsdomRadix } from "../../test/setupJsdomRadix.js";
import { OverwriteSavedAccountCredentialsConfirmationModal } from "./OverwriteSavedAccountCredentialsConfirmationModal.js";

afterEach(() => {
  cleanup();
  setRendererLanguage("ru");
});

describe("OverwriteSavedAccountCredentialsConfirmationModal", () => {
  beforeEach(() => {
    setupJsdomRadix();
    setRendererLanguage("ru");
  });

  it("renders two explicit choices when open", () => {
    render(
      <OverwriteSavedAccountCredentialsConfirmationModal
        open
        onConfirm={vi.fn()}
        onContinueWithoutOverwrite={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("overwrite-saved-account-credentials-modal")).toBeInTheDocument();
    expect(screen.getByText("Обновить сохранённые данные?")).toBeInTheDocument();
    expect(screen.getByTestId("overwrite-saved-account-credentials-cancel")).toBeInTheDocument();
    expect(screen.getByTestId("overwrite-saved-account-credentials-continue")).toHaveTextContent(
      "Войти без сохранения",
    );
    expect(screen.getByTestId("overwrite-saved-account-credentials-confirm")).toHaveTextContent(
      "Перезаписать и войти",
    );
  });

  it("invokes continue without overwrite from the primary split action", async () => {
    setRendererLanguage("en");
    const user = userEvent.setup();
    const onContinueWithoutOverwrite = vi.fn();
    const onConfirm = vi.fn();

    render(
      <OverwriteSavedAccountCredentialsConfirmationModal
        open
        onConfirm={onConfirm}
        onContinueWithoutOverwrite={onContinueWithoutOverwrite}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("overwrite-saved-account-credentials-continue"));
    expect(onContinueWithoutOverwrite).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("invokes overwrite from the explicit action", async () => {
    setRendererLanguage("en");
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onContinueWithoutOverwrite = vi.fn();

    render(
      <OverwriteSavedAccountCredentialsConfirmationModal
        open
        onConfirm={onConfirm}
        onContinueWithoutOverwrite={onContinueWithoutOverwrite}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("overwrite-saved-account-credentials-confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onContinueWithoutOverwrite).not.toHaveBeenCalled();
  });

  it("shows overwrite loader and disables the alternative while submitting", () => {
    render(
      <OverwriteSavedAccountCredentialsConfirmationModal
        open
        loading
        onConfirm={vi.fn()}
        onContinueWithoutOverwrite={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const confirmButton = screen.getByTestId("overwrite-saved-account-credentials-confirm");
    expect(confirmButton).toHaveAttribute("aria-busy", "true");
    expect(confirmButton).toBeDisabled();
    expect(screen.getByTestId("overwrite-saved-account-credentials-continue")).toBeDisabled();
  });

  it("invokes cancel callback", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <OverwriteSavedAccountCredentialsConfirmationModal
        open
        onConfirm={onConfirm}
        onContinueWithoutOverwrite={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByTestId("overwrite-saved-account-credentials-cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

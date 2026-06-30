// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsSessionsPanel } from "./SettingsSessionsPanel.js";

afterEach(() => {
  cleanup();
});

describe("SettingsSessionsPanel", () => {
  it("emits auto-answer toggle and timeout changes", async () => {
    const user = userEvent.setup();
    const onAutoAnswerEnabledChange = vi.fn();
    const onAutoAnswerTimeoutChange = vi.fn();

    render(
      <SettingsSessionsPanel
        multiSessionsEnabled
        onMultiSessionsChange={vi.fn()}
        autoAnswerEnabled={false}
        autoAnswerTimeoutSec={5}
        onAutoAnswerEnabledChange={onAutoAnswerEnabledChange}
        onAutoAnswerTimeoutChange={onAutoAnswerTimeoutChange}
        autoAnswerDuringActiveSessionEnabled={false}
        onAutoAnswerDuringActiveSessionChange={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("settings-auto-answer-enabled-toggle"));
    expect(onAutoAnswerEnabledChange).toHaveBeenCalledWith(true);

    const timeoutInput = screen.getByTestId("settings-auto-answer-timeout");
    expect(timeoutInput).toBeDisabled();
  });

  it("disables busy auto-answer when multi-sessions are off", () => {
    render(
      <SettingsSessionsPanel
        multiSessionsEnabled={false}
        onMultiSessionsChange={vi.fn()}
        autoAnswerEnabled
        autoAnswerTimeoutSec={3}
        onAutoAnswerEnabledChange={vi.fn()}
        onAutoAnswerTimeoutChange={vi.fn()}
        autoAnswerDuringActiveSessionEnabled={false}
        onAutoAnswerDuringActiveSessionChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("settings-auto-answer-during-active-session-toggle")).toBeDisabled();
    expect(screen.getByTestId("settings-auto-answer-during-active-session-hint")).toHaveTextContent(
      "Доступно только при включённых нескольких сессиях.",
    );
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsSessionsPanel } from "./SettingsSessionsPanel.js";

afterEach(() => {
  cleanup();
});

const ringtoneDefaults = {
  incomingRingtoneId: "classic" as const,
  onIncomingRingtoneIdChange: vi.fn(),
  onPreviewIncomingRingtone: vi.fn(),
  onStopIncomingRingtonePreview: vi.fn(),
};

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
        {...ringtoneDefaults}
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
        {...ringtoneDefaults}
      />,
    );

    expect(screen.getByTestId("settings-auto-answer-during-active-session-toggle")).toBeDisabled();
    expect(screen.getByTestId("settings-auto-answer-during-active-session-hint")).toHaveTextContent(
      "Доступно только при включённых нескольких сессиях.",
    );
  });

  it("toggles ringtone preview start and stop via volume icons", async () => {
    const user = userEvent.setup();
    const onPreviewIncomingRingtone = vi.fn();
    const onStopIncomingRingtonePreview = vi.fn();

    render(
      <SettingsSessionsPanel
        multiSessionsEnabled
        onMultiSessionsChange={vi.fn()}
        autoAnswerEnabled={false}
        autoAnswerTimeoutSec={5}
        onAutoAnswerEnabledChange={vi.fn()}
        onAutoAnswerTimeoutChange={vi.fn()}
        autoAnswerDuringActiveSessionEnabled={false}
        onAutoAnswerDuringActiveSessionChange={vi.fn()}
        {...ringtoneDefaults}
        incomingRingtoneId="soft-chime"
        onPreviewIncomingRingtone={onPreviewIncomingRingtone}
        onStopIncomingRingtonePreview={onStopIncomingRingtonePreview}
      />,
    );

    const previewButton = screen.getByTestId("settings-incoming-ringtone-preview");
    expect(previewButton).toHaveAttribute("aria-label", "Прослушать рингтон");
    expect(previewButton).toHaveAttribute("aria-pressed", "false");
    expect(previewButton.className).not.toMatch(/variantPrimary|variant-primary/);

    await user.click(previewButton);
    expect(onPreviewIncomingRingtone).toHaveBeenCalledWith("soft-chime");
    expect(previewButton).toHaveAttribute("aria-label", "Остановить прослушивание");
    expect(previewButton).toHaveAttribute("aria-pressed", "true");
    expect(previewButton.className).toMatch(/variantPrimary|variant-primary/);

    await user.click(previewButton);
    expect(onStopIncomingRingtonePreview).toHaveBeenCalled();
    expect(previewButton).toHaveAttribute("aria-label", "Прослушать рингтон");
    expect(previewButton).toHaveAttribute("aria-pressed", "false");
  });
});

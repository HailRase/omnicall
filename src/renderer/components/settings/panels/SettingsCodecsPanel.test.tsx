// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultUserSettings } from "@application/index.js";
import { SettingsCodecsPanel } from "./SettingsCodecsPanel.js";

afterEach(() => {
  cleanup();
});

const defaultPreferences = createDefaultUserSettings().codecPreferences;

const baseProps = {
  codecPreferences: defaultPreferences,
  onAudioCodecEnabledChange: vi.fn(),
  onVideoCodecEnabledChange: vi.fn(),
  onAudioCodecReorder: vi.fn(),
  onVideoCodecReorder: vi.fn(),
  mutationErrorKey: null,
} as const;

describe("SettingsCodecsPanel", () => {
  it("renders audio and video codec rows in ru locale", () => {
    render(<SettingsCodecsPanel {...baseProps} />);

    expect(screen.getByTestId("settings-codecs-panel")).toBeInTheDocument();
    expect(screen.getByTestId("settings-codecs-audio-list")).toBeInTheDocument();
    expect(screen.getByTestId("settings-codecs-video-list")).toBeInTheDocument();
    expect(screen.getByTestId("settings-codecs-audio-row-opus")).toBeInTheDocument();
    expect(screen.getByTestId("settings-codecs-video-row-vp8")).toBeInTheDocument();
    expect(screen.getByText("Opus")).toBeInTheDocument();
  });

  it("emits audio codec toggle changes", async () => {
    const user = userEvent.setup();
    const onAudioCodecEnabledChange = vi.fn();

    render(
      <SettingsCodecsPanel
        {...baseProps}
        onAudioCodecEnabledChange={onAudioCodecEnabledChange}
      />,
    );

    const pcmuToggle = screen.getByTestId("settings-codecs-audio-toggle-pcmu");
    await user.click(pcmuToggle);
    expect(onAudioCodecEnabledChange).toHaveBeenCalledWith("pcmu", false);
  });

  it("keeps telephone-event checkbox disabled", () => {
    render(<SettingsCodecsPanel {...baseProps} />);

    expect(screen.getByTestId("settings-codecs-audio-toggle-telephone-event")).toBeDisabled();
  });

  it("shows mutation error alert", () => {
    render(
      <SettingsCodecsPanel
        {...baseProps}
        mutationErrorKey="settings.codecs.errors.lastVoiceCodecRequired"
      />,
    );

    expect(screen.getByTestId("settings-codecs-error")).toHaveTextContent(
      "Должен остаться включённым хотя бы один голосовой аудиокодек.",
    );
  });
});

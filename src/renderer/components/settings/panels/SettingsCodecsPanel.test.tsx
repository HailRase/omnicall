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

  it("emits video codec toggle changes and keeps controls enabled", async () => {
    const onVideoCodecEnabledChange = vi.fn();
    const user = userEvent.setup();

    render(<SettingsCodecsPanel {...baseProps} />);

    expect(screen.getByTestId("settings-codecs-video-toggle-vp8")).toBeEnabled();
    expect(screen.getByTestId("settings-codecs-video-drag-vp8")).toBeEnabled();

    cleanup();
    render(
      <SettingsCodecsPanel
        {...baseProps}
        onVideoCodecEnabledChange={onVideoCodecEnabledChange}
      />,
    );
    await user.click(screen.getByTestId("settings-codecs-video-toggle-vp8"));
    expect(onVideoCodecEnabledChange).toHaveBeenCalledWith("vp8", false);
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

  it("disables toggle for the last enabled video codec", () => {
    const onlyH264Enabled = {
      ...defaultPreferences,
      video: defaultPreferences.video.map((entry) => ({
        ...entry,
        enabled: entry.id === "h264",
      })),
    };

    render(<SettingsCodecsPanel {...baseProps} codecPreferences={onlyH264Enabled} />);
    expect(screen.getByTestId("settings-codecs-video-toggle-h264")).toBeDisabled();
  });
});

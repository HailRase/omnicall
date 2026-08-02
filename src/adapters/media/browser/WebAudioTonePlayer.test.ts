import { describe, expect, it, vi } from "vitest";
import { WebAudioTonePlayer } from "./WebAudioTonePlayer.js";

function createToneTestContext(): Readonly<{
  context: AudioContext;
  createOscillator: ReturnType<typeof vi.fn>;
  createGain: ReturnType<typeof vi.fn>;
}> {
  const createGain = vi.fn(() => ({
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  const createOscillator = vi.fn(() => ({
    type: "sine" as OscillatorType,
    frequency: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  const context = {
    state: "running",
    currentTime: 0,
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    destination: {},
    createGain,
    createOscillator,
  };

  return {
    context: context as unknown as AudioContext,
    createOscillator,
    createGain,
  };
}

describe("WebAudioTonePlayer", () => {
  it("plays classic ringtone via FM ring graph", async () => {
    const { context, createOscillator } = createToneTestContext();
    const player = new WebAudioTonePlayer({
      createAudioContext: () => context,
      initialRingtoneId: "classic",
    });

    await player.play("call-classic", "ringtone");

    expect(createOscillator).toHaveBeenCalledTimes(2);
    expect(player.isPlaying("call-classic")).toBe(true);

    player.stop("call-classic");
    player.dispose();
  });

  it("plays catalog ringtone with a single oscillator step cadence", async () => {
    const { context, createOscillator } = createToneTestContext();
    const player = new WebAudioTonePlayer({
      createAudioContext: () => context,
      initialRingtoneId: "night-soft",
    });

    await player.play("call-soft", "ringtone", { ringtoneId: "soft-chime" });

    expect(createOscillator).toHaveBeenCalledTimes(1);
    expect(player.isPlaying("call-soft")).toBe(true);

    player.stop("call-soft");
    player.dispose();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLASSIC_RING_SEQUENCE_MS,
  createClassicRingtoneSession,
} from "./classicRingtone.js";

afterEach(() => {
  vi.useRealTimers();
});

function createMockContext(): Readonly<{
  context: AudioContext;
  createOscillator: ReturnType<typeof vi.fn>;
  createGain: ReturnType<typeof vi.fn>;
}> {
  const createOscillator = vi.fn(() => ({
    type: "sine" as OscillatorType,
    frequency: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  const createGain = vi.fn(() => ({
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  const context = {
    currentTime: 0,
    destination: {},
    createOscillator,
    createGain,
  };

  return {
    context: context as unknown as AudioContext,
    createOscillator,
    createGain,
  };
}

describe("classicRingtone", () => {
  it("exports classic ring cadence durations", () => {
    expect(CLASSIC_RING_SEQUENCE_MS).toEqual([440, 66, 660, 1980]);
  });

  it("builds FM ring graph with carrier and square LFO oscillators", () => {
    const { context, createOscillator, createGain } = createMockContext();
    const session = createClassicRingtoneSession(context);

    expect(createOscillator).toHaveBeenCalledTimes(2);
    expect(createGain).toHaveBeenCalledTimes(3);

    const tone = createOscillator.mock.results[0]?.value as {
      frequency: { value: number };
      start: ReturnType<typeof vi.fn>;
    };
    const lfo = createOscillator.mock.results[1]?.value as {
      type: OscillatorType;
      frequency: { value: number };
      start: ReturnType<typeof vi.fn>;
    };
    expect(tone.frequency.value).toBe(660);
    expect(lfo.frequency.value).toBe(15);
    expect(lfo.type).toBe("square");
    expect(tone.start).toHaveBeenCalled();
    expect(lfo.start).toHaveBeenCalled();

    session.stop();
  });

  it("advances cadence using classic ring sequence timings", () => {
    vi.useFakeTimers();
    const { context, createGain } = createMockContext();
    const session = createClassicRingtoneSession(context);
    const volumeControl = createGain.mock.results[1]?.value as {
      gain: { exponentialRampToValueAtTime: ReturnType<typeof vi.fn> };
    };

    expect(volumeControl.gain.exponentialRampToValueAtTime).toHaveBeenCalled();
    const callsBefore = volumeControl.gain.exponentialRampToValueAtTime.mock.calls.length;

    vi.advanceTimersByTime(CLASSIC_RING_SEQUENCE_MS[0]);
    expect(volumeControl.gain.exponentialRampToValueAtTime.mock.calls.length).toBeGreaterThan(
      callsBefore,
    );

    session.stop();
  });
});

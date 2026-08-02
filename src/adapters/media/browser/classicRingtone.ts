/**
 * - Purpose: classic incoming ring WebAudio synthesis (FM square-LFO carrier + cadence).
 * - Inputs: AudioContext.
 * - Outputs: stoppable WebAudio session.
 */

/** Cadence ms: on, off, on, off. */
export const CLASSIC_RING_SEQUENCE_MS = [440, 66, 660, 1980] as const;

const CLASSIC_CARRIER_HZ = 660;
const CLASSIC_LFO_HZ = 15;
const CLASSIC_FM_DEPTH = 200;
const CLASSIC_PEAK_GAIN = 0.5;
const CLASSIC_SILENCE_GAIN = 0.00001;
const CLASSIC_RAMP_SEC = 0.03;
const CLASSIC_STOP_FADE_MS = 250;

export type ClassicRingtoneSession = Readonly<{
  stop: () => void;
}>;

/**
 * - Purpose: start classic FM ringtone synthesis.
 * - Inputs: AudioContext (must be running/resumed).
 * - Outputs: session with stop that fades then tears down nodes.
 */
export function createClassicRingtoneSession(context: AudioContext): ClassicRingtoneSession {
  const toneOscillator = context.createOscillator();
  toneOscillator.frequency.value = CLASSIC_CARRIER_HZ;

  const gainOscillator = context.createOscillator();
  gainOscillator.frequency.value = CLASSIC_LFO_HZ;
  gainOscillator.type = "square";

  const masterGain = context.createGain();
  masterGain.gain.value = CLASSIC_PEAK_GAIN;

  const volumeControl = context.createGain();
  volumeControl.gain.value = CLASSIC_PEAK_GAIN;

  const frequencyControl = context.createGain();
  frequencyControl.gain.value = CLASSIC_FM_DEPTH;

  toneOscillator.connect(volumeControl);
  volumeControl.connect(masterGain);
  masterGain.connect(context.destination);
  frequencyControl.connect(toneOscillator.frequency);
  gainOscillator.connect(frequencyControl);

  toneOscillator.start(0);
  gainOscillator.start(0);

  let ringerTimer: ReturnType<typeof setTimeout> | null = null;
  let sequenceIndex = 0;
  let stopped = false;

  const scheduleNext = (): void => {
    if (stopped) {
      return;
    }
    const nextIndex = sequenceIndex >= CLASSIC_RING_SEQUENCE_MS.length ? 0 : sequenceIndex;
    const durationMs = CLASSIC_RING_SEQUENCE_MS[nextIndex] ?? 440;
    const gainValue = nextIndex % 2 === 0 ? CLASSIC_PEAK_GAIN : CLASSIC_SILENCE_GAIN;
    const now = context.currentTime;
    const current = Math.max(volumeControl.gain.value, CLASSIC_SILENCE_GAIN);

    volumeControl.gain.cancelScheduledValues(now);
    volumeControl.gain.setValueAtTime(current, now);
    volumeControl.gain.exponentialRampToValueAtTime(gainValue, now + CLASSIC_RAMP_SEC);

    ringerTimer = setTimeout(() => {
      sequenceIndex = nextIndex + 1;
      scheduleNext();
    }, durationMs);
  };

  scheduleNext();

  return {
    stop: (): void => {
      if (stopped) {
        return;
      }
      stopped = true;
      if (ringerTimer !== null) {
        clearTimeout(ringerTimer);
        ringerTimer = null;
      }

      const now = context.currentTime;
      try {
        volumeControl.gain.cancelScheduledValues(now);
        volumeControl.gain.setValueAtTime(
          Math.max(volumeControl.gain.value, CLASSIC_SILENCE_GAIN),
          now,
        );
        volumeControl.gain.exponentialRampToValueAtTime(
          CLASSIC_SILENCE_GAIN,
          now + CLASSIC_STOP_FADE_MS / 1000,
        );
      } catch {
        // AudioParam may already be disconnected.
      }

      setTimeout(() => {
        try {
          toneOscillator.stop(0);
          gainOscillator.stop(0);
        } catch {
          // Oscillators may already be stopped.
        }
        toneOscillator.disconnect();
        gainOscillator.disconnect();
        volumeControl.disconnect();
        frequencyControl.disconnect();
        masterGain.disconnect();
      }, CLASSIC_STOP_FADE_MS);
    },
  };
}

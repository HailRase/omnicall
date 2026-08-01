import {
  DEFAULT_INCOMING_RINGTONE_ID,
  type IncomingRingtoneId,
} from "@domain/index.js";
import { resolveRingtonePreset } from "./ringtonePresets.js";

/**
 * - Purpose: play and stop telephony tones via Web Audio API.
 * - Inputs: call id, tone kind, optional ringtone id / AudioContext factory.
 * - Outputs: started or stopped tone session per call id.
 */

export type ToneKind = "ringtone" | "ringback" | "busy" | "failed";

type ToneSession = Readonly<{
  stop: () => void;
}>;

type WebAudioTonePlayerOptions = Readonly<{
  createAudioContext?: () => AudioContext;
  initialRingtoneId?: IncomingRingtoneId;
}>;

export class WebAudioTonePlayer {
  private readonly createAudioContext: () => AudioContext;
  private context: AudioContext | null = null;
  private readonly sessions = new Map<string, ToneSession>();
  private activeRingtoneId: IncomingRingtoneId;

  constructor(options: WebAudioTonePlayerOptions = {}) {
    this.createAudioContext =
      options.createAudioContext ??
      ((): AudioContext => new AudioContext());
    this.activeRingtoneId = options.initialRingtoneId ?? DEFAULT_INCOMING_RINGTONE_ID;
  }

  getActiveRingtoneId(): IncomingRingtoneId {
    return this.activeRingtoneId;
  }

  setActiveRingtoneId(ringtoneId: IncomingRingtoneId): void {
    this.activeRingtoneId = ringtoneId;
  }

  isPlaying(callId: string): boolean {
    return this.sessions.has(callId);
  }

  async play(
    callId: string,
    kind: ToneKind,
    options: Readonly<{ ringtoneId?: IncomingRingtoneId }> = {},
  ): Promise<void> {
    this.stop(callId);

    const context = this.getOrCreateContext();
    if (context.state === "suspended") {
      await context.resume();
    }

    const ringtoneId = options.ringtoneId ?? this.activeRingtoneId;
    const session = createToneSession(context, kind, ringtoneId);
    this.sessions.set(callId, session);
  }

  stop(callId: string): void {
    const session = this.sessions.get(callId);
    if (session === undefined) {
      return;
    }

    session.stop();
    this.sessions.delete(callId);
  }

  dispose(): void {
    for (const callId of [...this.sessions.keys()]) {
      this.stop(callId);
    }

    void this.context?.close?.();
    this.context = null;
  }

  private getOrCreateContext(): AudioContext {
    if (this.context === null) {
      this.context = this.createAudioContext();
    }

    return this.context;
  }
}

function createToneSession(
  context: AudioContext,
  kind: ToneKind,
  ringtoneId: IncomingRingtoneId,
): ToneSession {
  const gainNode = context.createGain();
  gainNode.gain.value = 0.12;
  gainNode.connect(context.destination);

  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.connect(gainNode);

  const intervalTimers: ReturnType<typeof setInterval>[] = [];
  const timeoutTimers: ReturnType<typeof setTimeout>[] = [];
  let stopped = false;

  const stop = (): void => {
    if (stopped) {
      return;
    }

    stopped = true;
    for (const timer of intervalTimers) {
      clearInterval(timer);
    }
    for (const timer of timeoutTimers) {
      clearTimeout(timer);
    }

    try {
      oscillator.stop();
    } catch {
      // Oscillator may already be stopped.
    }

    gainNode.disconnect();
    oscillator.disconnect();
  };

  switch (kind) {
    case "ringtone":
      startRingtoneCadence(
        context,
        oscillator,
        gainNode,
        ringtoneId,
        intervalTimers,
        timeoutTimers,
        () => stopped,
      );
      break;
    case "ringback":
      gainNode.gain.value = 0.12;
      oscillator.frequency.value = 440;
      oscillator.start();
      intervalTimers.push(
        setInterval(() => {
          const isOn = gainNode.gain.value > 0;
          gainNode.gain.value = isOn ? 0 : 0.12;
        }, 2000),
      );
      break;
    case "busy":
      gainNode.gain.value = 0.12;
      oscillator.frequency.value = 480;
      oscillator.start();
      intervalTimers.push(
        setInterval(() => {
          const isOn = gainNode.gain.value > 0;
          gainNode.gain.value = isOn ? 0 : 0.12;
        }, 500),
      );
      break;
    case "failed":
      gainNode.gain.value = 0.12;
      oscillator.frequency.value = 300;
      oscillator.start();
      intervalTimers.push(
        setInterval(() => {
          const isOn = gainNode.gain.value > 0;
          gainNode.gain.value = isOn ? 0 : 0.12;
        }, 300),
      );
      break;
  }

  return { stop };
}

function startRingtoneCadence(
  _context: AudioContext,
  oscillator: OscillatorNode,
  gainNode: GainNode,
  ringtoneId: IncomingRingtoneId,
  intervalTimers: ReturnType<typeof setInterval>[],
  timeoutTimers: ReturnType<typeof setTimeout>[],
  isStopped: () => boolean,
): void {
  const preset = resolveRingtonePreset(ringtoneId);
  gainNode.gain.value = 0;
  oscillator.frequency.value = Math.max(preset.steps[0]?.frequencyHz ?? 440, 1);
  oscillator.start();

  // Classic dual-tone must remain identical to the pre-catalog interval flip.
  if (ringtoneId === "classic") {
    gainNode.gain.value = preset.masterGain;
    oscillator.frequency.value = 440;
    intervalTimers.push(
      setInterval(() => {
        oscillator.frequency.value = oscillator.frequency.value === 440 ? 480 : 440;
      }, 1000),
    );
    return;
  }

  let stepIndex = 0;

  const applyStep = (): void => {
    if (isStopped()) {
      return;
    }
    const step = preset.steps[stepIndex % preset.steps.length];
    if (step === undefined) {
      return;
    }
    if (step.frequencyHz > 0) {
      oscillator.frequency.value = step.frequencyHz;
    }
    gainNode.gain.value = step.gain > 0 ? preset.masterGain * step.gain : 0;
    stepIndex += 1;
    timeoutTimers.push(
      setTimeout(() => {
        applyStep();
      }, step.durationMs),
    );
  };

  applyStep();
}

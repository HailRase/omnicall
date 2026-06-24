/**
 * - Purpose: play and stop telephony tones via Web Audio API.
 * - Inputs: call id, tone kind, optional AudioContext factory.
 * - Outputs: started or stopped tone session per call id.
 */

export type ToneKind = "ringtone" | "ringback" | "busy" | "failed";

type ToneSession = Readonly<{
  stop: () => void;
}>;

type WebAudioTonePlayerOptions = Readonly<{
  createAudioContext?: () => AudioContext;
}>;

export class WebAudioTonePlayer {
  private readonly createAudioContext: () => AudioContext;
  private context: AudioContext | null = null;
  private readonly sessions = new Map<string, ToneSession>();

  constructor(options: WebAudioTonePlayerOptions = {}) {
    this.createAudioContext =
      options.createAudioContext ??
      ((): AudioContext => new AudioContext());
  }

  isPlaying(callId: string): boolean {
    return this.sessions.has(callId);
  }

  async play(callId: string, kind: ToneKind): Promise<void> {
    this.stop(callId);

    const context = this.getOrCreateContext();
    if (context.state === "suspended") {
      await context.resume();
    }

    const session = createToneSession(context, kind);
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

function createToneSession(context: AudioContext, kind: ToneKind): ToneSession {
  const gainNode = context.createGain();
  gainNode.gain.value = 0.12;
  gainNode.connect(context.destination);

  const oscillator = context.createOscillator();
  oscillator.connect(gainNode);

  const timers: ReturnType<typeof setInterval>[] = [];
  let stopped = false;

  const stop = (): void => {
    if (stopped) {
      return;
    }

    stopped = true;
    for (const timer of timers) {
      clearInterval(timer);
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
      oscillator.frequency.value = 440;
      oscillator.start();
      timers.push(
        setInterval(() => {
          oscillator.frequency.value = oscillator.frequency.value === 440 ? 480 : 440;
        }, 1000),
      );
      break;
    case "ringback":
      oscillator.frequency.value = 440;
      oscillator.start();
      timers.push(
        setInterval(() => {
          const isOn = gainNode.gain.value > 0;
          gainNode.gain.value = isOn ? 0 : 0.12;
        }, 2000),
      );
      break;
    case "busy":
      oscillator.frequency.value = 480;
      oscillator.start();
      timers.push(
        setInterval(() => {
          const isOn = gainNode.gain.value > 0;
          gainNode.gain.value = isOn ? 0 : 0.12;
        }, 500),
      );
      break;
    case "failed":
      oscillator.frequency.value = 300;
      oscillator.start();
      timers.push(
        setInterval(() => {
          const isOn = gainNode.gain.value > 0;
          gainNode.gain.value = isOn ? 0 : 0.12;
        }, 300),
      );
      break;
  }

  return { stop };
}

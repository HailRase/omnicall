export type HeadsetSyncBusyState = Readonly<{
  holdSessionId: string | null;
  muteSessionId: string | null;
  isBusy: boolean;
}>;

const HOLD_SYNC_GUARD_MS = 2000;
/** Firmware mute-echo window after begin/match (headset button inert). */
const MUTE_ECHO_MS = 300;
/**
 * Extra mute-echo after hold/resume LED writes — firmware often emits muteChanged
 * when the mute LED bit clears or presence pattern changes.
 */
const HOLD_LED_MUTE_ECHO_MS = 600;
/** Safety timeout for in-flight mute intent (match or abort should clear sooner). */
const MUTE_INTENT_GUARD_MS = 2000;
/** Minimum time the session-control mute button stays disabled after a toggle. */
const MUTE_UI_BUSY_MIN_MS = 250;

/**
 * - Purpose: exclusive mute/hold locks with separate UI busy vs headset echo windows.
 * - Inputs: begin/clear/abort sync intents, enqueue LED tasks.
 * - Outputs: busy projection for UI; hardware echo lock independent of UI begin.
 */
export class HeadsetSyncQueue {
  private chain: Promise<void> = Promise.resolve();
  private holdGuardUntil = 0;
  private muteEchoUntil = 0;
  private muteIntentUntil = 0;
  private muteUiBusyUntil = 0;
  private holdSessionId: string | null = null;
  private muteSessionId: string | null = null;
  private muteUiSessionId: string | null = null;
  private holdIntent: "hold" | "resume" | null = null;
  private muteIntent: boolean | null = null;
  private uiBusyClearTimer: ReturnType<typeof setTimeout> | null = null;
  private onUiBusyPossiblyCleared: (() => void) | null = null;

  enqueue(task: () => Promise<void>): void {
    this.chain = this.chain.then(task).catch(() => undefined);
  }

  setUiBusyClearListener(listener: (() => void) | null): void {
    this.onUiBusyPossiblyCleared = listener;
  }

  beginHoldSessionSync(sessionId: string, intent: "hold" | "resume"): boolean {
    if (this.hasPendingSyncIntent()) {
      return false;
    }
    this.holdSessionId = sessionId;
    this.holdGuardUntil = Date.now() + HOLD_SYNC_GUARD_MS;
    this.holdIntent = intent;
    return true;
  }

  beginMuteSessionSync(sessionId: string, muted: boolean): boolean {
    // Only block when another operation intent is open — never because of echo timer.
    if (this.hasPendingSyncIntent()) {
      return false;
    }
    this.muteSessionId = sessionId;
    this.muteUiSessionId = sessionId;
    this.muteIntent = muted;
    this.muteIntentUntil = Date.now() + MUTE_INTENT_GUARD_MS;
    this.muteEchoUntil = Date.now() + MUTE_ECHO_MS;
    this.muteUiBusyUntil = Date.now() + MUTE_UI_BUSY_MIN_MS;
    this.armUiBusyClearTimer();
    return true;
  }

  isHoldSyncGuardActive(): boolean {
    return Date.now() < this.holdGuardUntil;
  }

  isMuteSyncGuardActive(): boolean {
    return Date.now() < this.muteEchoUntil;
  }

  getHoldIntent(): "hold" | "resume" | null {
    return this.holdIntent;
  }

  getMuteIntent(): boolean | null {
    this.pruneExpiredIntents();
    return this.muteIntent;
  }

  /**
   * - Purpose: expose in-flight mute session for snapshot match (may differ from focus).
   * - Inputs: none.
   * - Outputs: mute intent session id, or null when no mute intent is open.
   */
  getMuteIntentSessionId(): string | null {
    this.pruneExpiredIntents();
    return this.muteIntent !== null ? this.muteSessionId : null;
  }

  hasPendingSyncIntent(): boolean {
    this.pruneExpiredIntents();
    return this.holdIntent !== null || this.muteIntent !== null;
  }

  isHardwareMuteLocked(): boolean {
    this.pruneExpiredIntents();
    return this.hasPendingSyncIntent() || this.isMuteSyncGuardActive();
  }

  /**
   * - Purpose: decide whether a headset muteChanged is firmware echo vs user action.
   * - Inputs: reported mute bit, current app mute, mute input mode (pulse|latch).
   * - Outputs: true = swallow event; false = forward to mute policy.
   *
   * Pending mute/hold intent always blocks.
   * Pulse (Jabra HSC016): echo window swallows all mute events (release bounce).
   * Latch (Poly): echo swallows only redundant matching bits; opposite = user override.
   */
  shouldIgnoreHardwareMuteEvent(
    eventMuted: boolean,
    currentMuted: boolean,
    muteInputMode: "pulse" | "latch" = "pulse",
  ): boolean {
    this.pruneExpiredIntents();
    if (this.hasPendingSyncIntent()) {
      return true;
    }
    if (!this.isMuteSyncGuardActive()) {
      return false;
    }
    if (muteInputMode === "pulse") {
      return true;
    }
    return eventMuted === currentMuted;
  }

  isHardwareHoldLocked(): boolean {
    this.pruneExpiredIntents();
    return this.hasPendingSyncIntent() || this.isHoldSyncGuardActive();
  }

  /**
   * - Purpose: swallow firmware muteChanged after hold/resume LED writes.
   * - Inputs: optional duration override (defaults to hold-LED echo window).
   * - Outputs: extends hardware mute lock without opening a mute intent/UI busy.
   */
  armHardwareMuteEcho(durationMs: number = HOLD_LED_MUTE_ECHO_MS): void {
    this.muteEchoUntil = Math.max(this.muteEchoUntil, Date.now() + durationMs);
  }

  clearHoldSyncIfMatched(sessionId: string, isOnHold: boolean): void {
    if (this.holdSessionId !== sessionId || this.holdIntent === null) {
      return;
    }
    if (this.holdIntent === "hold" && isOnHold) {
      this.clearHoldIntent();
      return;
    }
    if (this.holdIntent === "resume" && !isOnHold) {
      this.clearHoldIntent();
    }
  }

  clearMuteSyncIfMatched(sessionId: string, muted: boolean): void {
    if (this.muteSessionId !== sessionId || this.muteIntent === null) {
      return;
    }
    if (this.muteIntent === muted) {
      this.muteSessionId = null;
      this.muteIntent = null;
      this.muteIntentUntil = 0;
      this.muteEchoUntil = Math.max(this.muteEchoUntil, Date.now() + MUTE_ECHO_MS);
      this.muteUiBusyUntil = Math.max(this.muteUiBusyUntil, Date.now() + MUTE_UI_BUSY_MIN_MS);
      this.armUiBusyClearTimer();
    }
  }

  abortHoldSync(sessionId?: string): void {
    if (sessionId !== undefined && this.holdSessionId !== sessionId) {
      return;
    }
    this.clearHoldIntent();
  }

  abortMuteSync(sessionId?: string): void {
    if (
      sessionId !== undefined &&
      this.muteSessionId !== sessionId &&
      this.muteUiSessionId !== sessionId
    ) {
      return;
    }
    this.muteSessionId = null;
    this.muteIntent = null;
    this.muteUiSessionId = null;
    this.muteIntentUntil = 0;
    this.muteEchoUntil = 0;
    this.muteUiBusyUntil = 0;
    this.clearUiBusyClearTimer();
  }

  private clearHoldIntent(): void {
    this.holdSessionId = null;
    this.holdIntent = null;
    this.holdGuardUntil = 0;
  }

  private pruneExpiredIntents(): void {
    const now = Date.now();
    if (this.holdIntent !== null && now >= this.holdGuardUntil) {
      this.holdSessionId = null;
      this.holdIntent = null;
    }
    if (this.muteIntent !== null && now >= this.muteIntentUntil) {
      this.muteSessionId = null;
      this.muteIntent = null;
      this.muteIntentUntil = 0;
      this.muteUiSessionId = null;
      this.muteUiBusyUntil = 0;
      this.clearUiBusyClearTimer();
      this.onUiBusyPossiblyCleared?.();
    }
  }

  private armUiBusyClearTimer(): void {
    this.clearUiBusyClearTimer();
    const now = Date.now();
    let deadline = this.muteUiBusyUntil;
    if (this.muteIntent !== null) {
      deadline = Math.max(deadline, this.muteIntentUntil);
    }
    const delay = Math.max(0, deadline - now);
    this.uiBusyClearTimer = setTimeout(() => {
      this.uiBusyClearTimer = null;
      this.pruneExpiredIntents();
      if (this.muteIntent === null) {
        this.muteUiSessionId = null;
        this.muteUiBusyUntil = 0;
      }
      this.onUiBusyPossiblyCleared?.();
    }, delay);
  }

  private clearUiBusyClearTimer(): void {
    if (this.uiBusyClearTimer !== null) {
      clearTimeout(this.uiBusyClearTimer);
      this.uiBusyClearTimer = null;
    }
  }

  /**
   * UI busy = pending mute/hold intent OR short mute UI settle window.
   * Headset echo timer alone must not disable session control bar.
   */
  getBusyState(): HeadsetSyncBusyState {
    this.pruneExpiredIntents();
    const now = Date.now();
    const muteUiBusy =
      this.muteIntent !== null ||
      (this.muteUiSessionId !== null && now < this.muteUiBusyUntil);
    const holdSessionId = this.holdIntent !== null ? this.holdSessionId : null;
    const muteSessionId = muteUiBusy
      ? (this.muteSessionId ?? this.muteUiSessionId)
      : null;
    return {
      holdSessionId,
      muteSessionId,
      isBusy: holdSessionId !== null || muteSessionId !== null,
    };
  }
}

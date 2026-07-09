export type HeadsetSyncIntent = "hold" | "resume" | "mute";

export type HeadsetSyncBusyState = Readonly<{
  holdSessionId: string | null;
  muteSessionId: string | null;
  isBusy: boolean;
}>;

const HOLD_SYNC_GUARD_MS = 2000;
const MUTE_SYNC_GUARD_MS = 600;

/**
 * - Purpose: serialize headset LED batches and track UI sync busy state.
 * - Inputs: enqueue tasks, begin hold/mute sync sessions.
 * - Outputs: FIFO execution and busy projection for LF-074.
 */
export class HeadsetSyncQueue {
  private chain: Promise<void> = Promise.resolve();
  private holdGuardUntil = 0;
  private muteGuardUntil = 0;
  private holdSessionId: string | null = null;
  private muteSessionId: string | null = null;

  enqueue(task: () => Promise<void>): void {
    this.chain = this.chain.then(task).catch(() => undefined);
  }

  beginHoldSessionSync(sessionId: string, intent: "hold" | "resume"): void {
    this.holdSessionId = sessionId;
    this.holdGuardUntil = Date.now() + HOLD_SYNC_GUARD_MS;
    void intent;
  }

  beginMuteSessionSync(sessionId: string, muted: boolean): void {
    this.muteSessionId = sessionId;
    this.muteGuardUntil = Date.now() + MUTE_SYNC_GUARD_MS;
    void muted;
  }

  isHoldSyncGuardActive(): boolean {
    return Date.now() < this.holdGuardUntil;
  }

  isMuteSyncGuardActive(): boolean {
    return Date.now() < this.muteGuardUntil;
  }

  clearHoldSyncIfMatched(sessionId: string): void {
    if (this.holdSessionId === sessionId) {
      this.holdSessionId = null;
      this.holdGuardUntil = 0;
    }
  }

  clearMuteSyncIfMatched(sessionId: string): void {
    if (this.muteSessionId === sessionId) {
      this.muteSessionId = null;
      this.muteGuardUntil = 0;
    }
  }

  getBusyState(): HeadsetSyncBusyState {
    const holdBusy = this.holdSessionId !== null && this.isHoldSyncGuardActive();
    const muteBusy = this.muteSessionId !== null && this.isMuteSyncGuardActive();
    return {
      holdSessionId: holdBusy ? this.holdSessionId : null,
      muteSessionId: muteBusy ? this.muteSessionId : null,
      isBusy: holdBusy || muteBusy,
    };
  }
}

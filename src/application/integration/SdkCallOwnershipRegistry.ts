/**
 * In-memory SDK call ownership (DI-06 / ADR-0017 O-OWN-1).
 * Aggregate revision lives on SdkSessionRevisionClock — not per-call.
 * Process-lifetime only — no disk secrets, no Domain storage.
 */

export type SdkCallOwnershipRecord = Readonly<{
  ownerClientId: string;
  terminal: boolean;
}>;

export class SdkCallOwnershipRegistry {
  private readonly byCallId = new Map<string, SdkCallOwnershipRecord>();

  get(callId: string): SdkCallOwnershipRecord | undefined {
    return this.byCallId.get(callId);
  }

  getOwnerClientId(callId: string): string | undefined {
    const record = this.byCallId.get(callId);
    if (record === undefined || record.terminal) {
      return undefined;
    }
    return record.ownerClientId;
  }

  /**
   * Assign owner after successful originate/answer.
   */
  assignOwner(callId: string, ownerClientId: string): SdkCallOwnershipRecord {
    const record: SdkCallOwnershipRecord = {
      ownerClientId,
      terminal: false,
    };
    this.byCallId.set(callId, record);
    return record;
  }

  /**
   * Mark terminal on Domain ended/failed — ownership no longer grants control.
   */
  finalize(callId: string): void {
    const current = this.byCallId.get(callId);
    if (current === undefined) {
      return;
    }
    this.byCallId.set(callId, { ...current, terminal: true });
  }

  /** Drop record entirely (tests / dispose). */
  clear(callId: string): void {
    this.byCallId.delete(callId);
  }

  clearAll(): void {
    this.byCallId.clear();
  }
}

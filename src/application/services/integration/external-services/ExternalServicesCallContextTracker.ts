/**
 * - Purpose: retain typed call, campaign, and safe ACD facts between committed events.
 * - Inputs: normalized call parties, terminal reasons, campaign offers, and ACD facts.
 * - Outputs: bounded event-time context snapshots for External Services mapping.
 */
export type ExternalServicesCallContext = Readonly<{
  callId: string;
  callerId?: string;
  calledId?: string;
  direction: "inbound" | "outbound";
  userLogin?: string;
  hangupReason?: string;
  acd?: Readonly<Record<string, string>>;
}>;

export type ExternalServicesCampaignContext = Readonly<Record<string, string>>;

const MAX_TRACKED_CALLS = 100;
const MAX_TRACKED_CAMPAIGNS = 100;

export class ExternalServicesCallContextTracker {
  private readonly calls = new Map<string, ExternalServicesCallContext>();
  private readonly campaigns = new Map<string, ExternalServicesCampaignContext>();
  private readonly acdFingerprints = new Set<string>();

  trackIncoming(callId: string, callerId: string, userLogin?: string): void {
    this.setCall(callId, {
      callId,
      callerId,
      direction: "inbound",
      ...withOptional("calledId", userLogin),
      ...withOptional("userLogin", userLogin),
    });
  }

  trackOutgoing(callId: string, calledId: string, userLogin?: string): void {
    this.setCall(callId, {
      callId,
      calledId,
      direction: "outbound",
      ...withOptional("callerId", userLogin),
      ...withOptional("userLogin", userLogin),
    });
  }

  getCall(callId: string): ExternalServicesCallContext | null {
    return this.calls.get(callId) ?? null;
  }

  recordTerminalReason(callId: string, hangupReason: string): void {
    const existing = this.calls.get(callId);
    if (existing === undefined) {
      return;
    }
    this.setCall(callId, { ...existing, hangupReason });
  }

  mergeAcd(
    input: Readonly<{
      callId: string;
      callerId: string;
      calledId: string;
      direction: "inbound" | "outbound";
      userLogin: string;
      queueName: string;
      phase: string;
      event: string;
    }>,
  ): boolean {
    const fingerprint = [
      input.callId,
      input.queueName,
      input.phase,
      input.event,
      input.callerId,
      input.calledId,
    ].join("\u0000");
    if (this.acdFingerprints.has(fingerprint)) {
      return false;
    }
    this.acdFingerprints.add(fingerprint);
    const existing = this.calls.get(input.callId);
    this.setCall(input.callId, {
      callId: input.callId,
      callerId: input.callerId,
      calledId: input.calledId,
      direction: input.direction,
      userLogin: input.userLogin,
      acd: {
        queue_name: input.queueName,
        acd_phase: input.phase,
        acd_event: input.event,
      },
      ...withOptional("hangupReason", existing?.hangupReason),
    });
    return true;
  }

  cacheCampaign(
    campaignId: string,
    campaign: ExternalServicesCampaignContext,
  ): void {
    this.campaigns.set(campaignId, campaign);
    this.cap(this.campaigns, MAX_TRACKED_CAMPAIGNS);
  }

  takeCampaign(campaignId: string): ExternalServicesCampaignContext | null {
    const campaign = this.campaigns.get(campaignId) ?? null;
    this.campaigns.delete(campaignId);
    return campaign;
  }

  scheduleCallCleanup(callId: string): void {
    queueMicrotask(() => {
      this.calls.delete(callId);
      for (const fingerprint of this.acdFingerprints) {
        if (fingerprint.startsWith(`${callId}\u0000`)) {
          this.acdFingerprints.delete(fingerprint);
        }
      }
    });
  }

  clear(): void {
    this.calls.clear();
    this.campaigns.clear();
    this.acdFingerprints.clear();
  }

  private setCall(callId: string, context: ExternalServicesCallContext): void {
    this.calls.set(callId, Object.freeze({ ...context }));
    this.cap(this.calls, MAX_TRACKED_CALLS);
  }

  private cap<T>(entries: Map<string, T>, maxEntries: number): void {
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) {
        return;
      }
      entries.delete(oldest);
    }
  }
}

function withOptional<TKey extends string>(
  key: TKey,
  value: string | undefined,
): Partial<Record<TKey, string>> {
  return value === undefined ? {} : { [key]: value } as Partial<Record<TKey, string>>;
}

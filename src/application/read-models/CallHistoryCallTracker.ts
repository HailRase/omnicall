import { createCallId, type CallId, type DomainEvent } from "@domain/index.js";
import type { CallHistorySessionSnapshot } from "@domain/settings/CallHistoryEntry.js";
import { isSessionResetEvent } from "../projections/platform/sessionResetEvents.js";

type TrackedCallSession = Readonly<{
  callId: CallId;
  direction: "incoming" | "outgoing";
  remoteNumber: string | null;
  displayLabel: string | null;
  startedAt: string;
  answeredAt: string | null;
  wasAnswered: boolean;
  localHangup: boolean;
}>;

/**
 * - Purpose: track active call metadata needed to build call history entries.
 * - Inputs: telephony domain events while calls are in progress.
 * - Outputs: finalized CallHistorySessionSnapshot on qualifying end events.
 */
export class CallHistoryCallTracker {
  private readonly sessions = new Map<string, TrackedCallSession>();

  consume(event: DomainEvent): CallHistorySessionSnapshot | null {
    switch (event.type) {
      case "OutgoingCallRequested":
        return this.trackOutgoing(event);
      case "IncomingCallReceived":
        return this.trackIncoming(event);
      case "IncomingCallDisplayNameResolved":
        this.updateDisplayName(event);
        return null;
      case "CallAnswered":
        this.markAnswered(event);
        return null;
      case "CallHangupRequested":
        this.markLocalHangup(event);
        return null;
      case "CallRejected":
      case "CallRejectedByDnd":
        this.markLocalHangup(event);
        return this.finalize(event, {
          failed: false,
          remoteCancelBeforeAnswer: false,
        });
      case "CallEnded":
        return this.finalize(event, {
          failed: false,
          remoteCancelBeforeAnswer: false,
        });
      case "IncomingCallEndedBeforeAnswer":
        return this.finalize(event, {
          failed: false,
          remoteCancelBeforeAnswer: true,
        });
      case "CallFailed":
        return this.finalize(event, {
          failed: true,
          remoteCancelBeforeAnswer: false,
        });
      default:
        if (isSessionResetEvent(event)) {
          this.sessions.clear();
        }
        return null;
    }
  }

  private trackOutgoing(event: DomainEvent): null {
    const callId = parseCallId(event["callId"]);
    if (callId === null) {
      return null;
    }

    this.sessions.set(callId, {
      callId,
      direction: "outgoing",
      remoteNumber: asOptionalString(event["phoneNumber"]),
      displayLabel: asOptionalString(event["phoneNumber"]),
      startedAt: event.occurredAt,
      answeredAt: null,
      wasAnswered: false,
      localHangup: false,
    });
    return null;
  }

  private trackIncoming(event: DomainEvent): null {
    const callId = parseCallId(event["callId"]);
    if (callId === null) {
      return null;
    }

    this.sessions.set(callId, {
      callId,
      direction: "incoming",
      remoteNumber: asOptionalString(event["phoneNumber"]),
      displayLabel: asOptionalString(event["phoneNumber"]),
      startedAt: event.occurredAt,
      answeredAt: null,
      wasAnswered: false,
      localHangup: false,
    });
    return null;
  }

  private updateDisplayName(event: DomainEvent): void {
    const callId = parseCallId(event["callId"]);
    if (callId === null) {
      return;
    }

    const existing = this.sessions.get(callId);
    if (existing === undefined) {
      return;
    }

    this.sessions.set(callId, {
      ...existing,
      displayLabel: asOptionalString(event["displayName"]) ?? existing.displayLabel,
    });
  }

  private markAnswered(event: DomainEvent): void {
    const callId = parseCallId(event["callId"]);
    if (callId === null) {
      return;
    }

    const existing = this.sessions.get(callId);
    if (existing === undefined) {
      return;
    }

    this.sessions.set(callId, {
      ...existing,
      wasAnswered: true,
      answeredAt: existing.answeredAt ?? event.occurredAt,
    });
  }

  private markLocalHangup(event: DomainEvent): void {
    const callId = parseCallId(event["callId"]);
    if (callId === null) {
      return;
    }

    const existing = this.sessions.get(callId);
    if (existing === undefined) {
      return;
    }

    this.sessions.set(callId, {
      ...existing,
      localHangup: true,
    });
  }

  private finalize(
    event: DomainEvent,
    flags: Readonly<{ failed: boolean; remoteCancelBeforeAnswer: boolean }>,
  ): CallHistorySessionSnapshot | null {
    const callId = parseCallId(event["callId"]);
    if (callId === null) {
      return null;
    }

    const existing = this.sessions.get(callId);
    this.sessions.delete(callId);
    if (existing === undefined) {
      return null;
    }

    return {
      callId: existing.callId,
      direction: existing.direction,
      remoteNumber: existing.remoteNumber,
      displayLabel: existing.displayLabel,
      startedAt: existing.startedAt,
      answeredAt: existing.answeredAt,
      endedAt: event.occurredAt,
      wasAnswered: existing.wasAnswered,
      failed: flags.failed,
      localHangup: existing.localHangup,
      remoteCancelBeforeAnswer: flags.remoteCancelBeforeAnswer && !existing.wasAnswered,
    };
  }
}

function parseCallId(value: unknown): CallId | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return createCallId(value);
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

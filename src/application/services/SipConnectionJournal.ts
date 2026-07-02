import type { DomainEvent } from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type SipConnectionJournalCategory = "transport" | "registration";

export type SipConnectionJournalEntry = Readonly<{
  timestamp: string;
  correlationId: CorrelationId;
  category: SipConnectionJournalCategory;
  eventType: string;
  detail: string | null;
}>;

const TRANSPORT_EVENT_TYPES = new Set([
  "SipTransportConnecting",
  "SipTransportConnected",
  "SipTransportDisconnected",
  "SipTransportReconnectScheduled",
  "SipTransportReconnectAttemptStarted",
  "SipTransportReconnectSucceeded",
  "SipTransportReconnectFailed",
  "ManualSipTransportReconnectRequested",
  "SipRegistrationCleared",
]);

const REGISTRATION_EVENT_TYPES = new Set([
  "SipRegistrationRetryScheduled",
  "SipRegistrationRetryAttemptStarted",
  "SipRegistrationRetrySucceeded",
  "SipRegistrationRetryFailed",
  "ManualSipReregisterRequested",
  "RegistrationRequested",
  "RegistrationSucceeded",
  "RegistrationFailed",
]);

/**
 * - Purpose: in-memory SIP transport/registration journal for settings panel (ADR-0004).
 * - Inputs: domain events or manual journal records.
 * - Outputs: bounded ring buffer of journal entries.
 */
export class SipConnectionJournal {
  private readonly entries: SipConnectionJournalEntry[] = [];

  constructor(private readonly maxEntries = 100) {}

  record(
    entry: Readonly<{
      correlationId: CorrelationId;
      category: SipConnectionJournalCategory;
      eventType: string;
      detail?: string | null;
      timestamp?: string;
    }>,
  ): void {
    const next: SipConnectionJournalEntry = {
      timestamp: entry.timestamp ?? new Date().toISOString(),
      correlationId: entry.correlationId,
      category: entry.category,
      eventType: entry.eventType,
      detail: entry.detail ?? null,
    };
    this.entries.push(next);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  recordDomainEvent(event: DomainEvent): void {
    const category = resolveJournalCategory(event.type);
    if (category === null) {
      return;
    }

    this.record({
      correlationId: event.correlationId,
      category,
      eventType: event.type,
      detail: resolveJournalDetail(event),
      timestamp: event.occurredAt,
    });
  }

  getEntries(): ReadonlyArray<SipConnectionJournalEntry> {
    return this.entries;
  }

  clear(): void {
    this.entries.length = 0;
  }
}

function resolveJournalCategory(eventType: string): SipConnectionJournalCategory | null {
  if (TRANSPORT_EVENT_TYPES.has(eventType)) {
    return "transport";
  }
  if (REGISTRATION_EVENT_TYPES.has(eventType)) {
    return "registration";
  }
  return null;
}

function resolveJournalDetail(event: DomainEvent): string | null {
  const reason = event["reason"];
  if (typeof reason === "string" && reason.length > 0) {
    return reason;
  }
  const message = event["message"];
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  return null;
}

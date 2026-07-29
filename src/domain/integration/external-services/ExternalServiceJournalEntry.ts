/**
 * - Purpose: define immutable, safe External Services dispatch history records.
 * - Inputs: redacted request facts and normalized transport outcomes.
 * - Outputs: profile-scoped journal entries for persistence and projections.
 */
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { SettingsAccountKey } from "../../settings/SettingsAccountKey.js";
import type { ExternalServiceEventType } from "./ExternalServiceEventType.js";
import type {
  ExternalServiceCollectionId,
  ExternalServiceRequestId,
} from "./ExternalServiceIds.js";
import type { ExternalServiceKeyValue } from "./ExternalServiceHttpDefinition.js";

export const EXTERNAL_SERVICE_JOURNAL_OUTCOMES = [
  "http_success",
  "http_error",
  "network_error",
  "timeout",
  "aborted",
] as const;

export type ExternalServiceJournalOutcome =
  (typeof EXTERNAL_SERVICE_JOURNAL_OUTCOMES)[number];

export type ExternalServiceJournalEntry = Readonly<{
  id: string;
  profileKey: SettingsAccountKey;
  collectionId: ExternalServiceCollectionId;
  collectionName: string;
  requestId: ExternalServiceRequestId;
  requestName: string;
  eventType: ExternalServiceEventType;
  startedAt: string;
  durationMs: number;
  outcome: ExternalServiceJournalOutcome;
  status: number | null;
  requestUrl: string;
  requestHeaders: ReadonlyArray<ExternalServiceKeyValue>;
  responseBody: string;
  responseBodyTruncated: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  correlationId: CorrelationId;
}>;

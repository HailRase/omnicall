/**
 * - Purpose: define immutable External Applications open-history records.
 * - Inputs: open attempt facts after condition checks and gateway results.
 * - Outputs: profile-scoped journal entries for persistence and projections.
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { SettingsAccountKey } from "../../settings/SettingsAccountKey.js";
import type { ExternalServiceEventType } from "../external-services/ExternalServiceEventType.js";
import type { ExternalApplicationId } from "./ExternalApplicationIds.js";
import type { ExternalApplicationOpenMode } from "./ExternalApplicationsSettings.js";

export const EXTERNAL_APPLICATION_JOURNAL_OUTCOMES = [
  "opened",
  "focused_existing",
  "skipped_condition",
  "skipped_invalid_url",
  "skipped_lifecycle",
  "failed",
] as const;

export type ExternalApplicationJournalOutcome =
  (typeof EXTERNAL_APPLICATION_JOURNAL_OUTCOMES)[number];

export type ExternalApplicationJournalEntry = Readonly<{
  id: string;
  profileKey: SettingsAccountKey;
  applicationId: ExternalApplicationId;
  applicationName: string;
  eventType: ExternalServiceEventType;
  startedAt: string;
  outcome: ExternalApplicationJournalOutcome;
  skipReason: string | null;
  resolvedUrl: string | null;
  openMode: ExternalApplicationOpenMode;
  callId: string | null;
  correlationId: CorrelationId;
}>;

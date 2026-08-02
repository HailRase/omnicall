import type { JSX } from "react";
import clsx from "clsx";
import type {
  ExternalServicesJournalEntryVm,
  ExternalServicesJournalOutcomeVm,
} from "@application/index.js";
import { formatLocaleDateTime, useI18n } from "../../../i18n/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import type { BadgeTone } from "../../ui/types.js";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
} from "../../ui/index.js";
import { ExternalServicesJournalEntryDetail } from "./ExternalServicesJournalEntryDetail.js";
import styles from "./ExternalServices.module.css";

const OUTCOME_KEYS: Readonly<
  Record<ExternalServicesJournalOutcomeVm, TranslationKey>
> = {
  http_success: "settings.integrations.externalServices.journal.outcome.http_success",
  http_error: "settings.integrations.externalServices.journal.outcome.http_error",
  network_error: "settings.integrations.externalServices.journal.outcome.network_error",
  timeout: "settings.integrations.externalServices.journal.outcome.timeout",
  aborted: "settings.integrations.externalServices.journal.outcome.aborted",
};

const OUTCOME_TONES: Readonly<Record<ExternalServicesJournalOutcomeVm, BadgeTone>> = {
  http_success: "success",
  http_error: "destructive",
  network_error: "destructive",
  timeout: "warning",
  aborted: "muted",
};

const EVENT_KEYS: Readonly<Record<string, TranslationKey>> = {
  incoming_ringing: "settings.integrations.externalServices.trigger.incoming_ringing",
  outgoing_connecting: "settings.integrations.externalServices.trigger.outgoing_connecting",
  call_answered: "settings.integrations.externalServices.trigger.call_answered",
  call_ended: "settings.integrations.externalServices.trigger.call_ended",
  call_rejected: "settings.integrations.externalServices.trigger.call_rejected",
  call_missed: "settings.integrations.externalServices.trigger.call_missed",
  campaign_offered: "settings.integrations.externalServices.trigger.campaign_offered",
  campaign_accepted: "settings.integrations.externalServices.trigger.campaign_accepted",
  campaign_rejected: "settings.integrations.externalServices.trigger.campaign_rejected",
  acd_context_appeared: "settings.integrations.externalServices.trigger.acd_context_appeared",
  post_call_processing: "settings.integrations.externalServices.trigger.post_call_processing",
  manual_run: "settings.integrations.externalServices.trigger.manual_run",
};

const METHOD_CLASS: Readonly<Record<string, string>> = {
  GET: styles.methodGet,
  POST: styles.methodPost,
  PUT: styles.methodPut,
  PATCH: styles.methodPatch,
  DELETE: styles.methodDelete,
};

type Translator = ReturnType<typeof useI18n>["t"];

export type ExternalServicesJournalEntryProps = Readonly<{
  entry: ExternalServicesJournalEntryVm;
  language: ReturnType<typeof useI18n>["language"];
  t: Translator;
}>;

/**
 * - Purpose: render one expandable External Services journal attempt row.
 * - Inputs: safe entry VM, locale, and translator.
 * - Outputs: accordion item with summary badges and diagnostic detail.
 * @uiMeta f=F-031
 */
export function ExternalServicesJournalEntry({
  entry,
  language,
  t,
}: ExternalServicesJournalEntryProps): JSX.Element {
  const eventKey = EVENT_KEYS[entry.eventType];
  const eventLabel = eventKey !== undefined ? t(eventKey) : entry.eventType;

  return (
    <AccordionItem
      value={entry.id}
      data-testid={`external-services-journal-entry-${entry.id}`}
    >
      <AccordionTrigger className={styles.journalTrigger}>
        <span className={styles.journalSummary}>
          <span className={styles.journalSummaryTime}>
            {formatLocaleDateTime(entry.startedAt, language)}
          </span>
          <span className={styles.journalSummaryNames}>
            {entry.requestName} · {entry.collectionName}
          </span>
          <span className={styles.journalSummaryMeta}>
            <span
              className={clsx(
                styles.methodBadge,
                METHOD_CLASS[entry.method] ?? styles.methodGet,
              )}
              data-testid={`external-services-journal-method-${entry.id}`}
            >
              {entry.method}
            </span>
            <span className={styles.journalSummarySep} aria-hidden="true" />
            <Badge tone="muted" size="sm">
              {eventLabel}
            </Badge>
            <span className={styles.journalSummarySep} aria-hidden="true" />
            <Badge tone={OUTCOME_TONES[entry.outcome]} size="sm">
              {t(OUTCOME_KEYS[entry.outcome])}
            </Badge>
            <span className={styles.journalSummarySep} aria-hidden="true" />
            <span className={styles.journalSummaryStat}>
              {entry.status === null
                ? t("settings.integrations.externalServices.journal.noStatus")
                : String(entry.status)}
            </span>
            <span className={styles.journalSummarySep} aria-hidden="true" />
            <span className={styles.journalSummaryStat}>
              {t("settings.integrations.externalServices.journal.durationValue", {
                duration: entry.durationMs,
              })}
            </span>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <ExternalServicesJournalEntryDetail entry={entry} t={t} />
      </AccordionContent>
    </AccordionItem>
  );
}

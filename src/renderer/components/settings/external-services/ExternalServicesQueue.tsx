/**
 * - Purpose: display delayed automatic jobs that have not started HTTP.
 * - Inputs: waiting job projection and cancel callback.
 * - Outputs: accessible queue rows with countdown and cancellation intents.
 */
import { useEffect, useState, type JSX } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { formatLocaleDateTime, useI18n } from "../../../i18n/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import { IconControlButton } from "../../icons/IconControlButton.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesQueueItem = Readonly<{
  jobId: string;
  collectionName: string;
  requestName: string;
  method: string;
  eventType: string;
  occurredAt: string;
  fireAt: string;
}>;

export type ExternalServicesQueueProps = Readonly<{
  items: ReadonlyArray<ExternalServicesQueueItem>;
  onCancel: (jobId: string) => void;
}>;

const METHOD_CLASS: Readonly<Record<string, string>> = {
  GET: styles.methodGet,
  POST: styles.methodPost,
  PUT: styles.methodPut,
  PATCH: styles.methodPatch,
  DELETE: styles.methodDelete,
};

const TRIGGER_KEYS: Readonly<Record<string, TranslationKey>> = {
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
};

/**
 * - Purpose: Postman-like delayed-job queue under the response pane.
 * - Inputs: waiting rows with fireAt and cancel intent.
 * - Outputs: animated countdown list without business timer ownership.
 * @uiMeta f=F-031
 */
export function ExternalServicesQueue({
  items,
  onCancel,
}: ExternalServicesQueueProps): JSX.Element {
  const { t, language } = useI18n();
  const reduceMotion = useReducedMotion();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  if (items.length === 0) {
    return (
      <div className={styles.responseEmpty} data-testid="external-services-queue-empty">
        <p className={styles.responseEmptyText}>
          {t("settings.integrations.externalServices.queue.empty")}
        </p>
      </div>
    );
  }

  return (
    <ul className={styles.queueList} data-testid="external-services-queue">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const triggerKey = TRIGGER_KEYS[item.eventType];
          const eventLabel = triggerKey === undefined ? item.eventType : t(triggerKey);
          return (
            <motion.li
              key={item.jobId}
              layout={!reduceMotion}
              className={styles.queueRow}
              data-testid={`external-services-queue-row-${item.jobId}`}
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              {...(reduceMotion
                ? {}
                : { exit: { opacity: 0, height: 0 } })}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <span
                className={clsx(
                  styles.methodBadge,
                  METHOD_CLASS[item.method] ?? styles.methodGet,
                )}
              >
                {item.method}
              </span>
              <div className={styles.queueMain}>
                <span className={styles.queueRequestName}>{item.requestName}</span>
                <span className={styles.queueMeta}>
                  {item.collectionName}
                  {" · "}
                  {eventLabel}
                  {" · "}
                  {formatLocaleDateTime(item.occurredAt, language)}
                </span>
              </div>
              <span
                className={styles.queueCountdown}
                data-testid={`external-services-queue-countdown-${item.jobId}`}
              >
                {formatRemaining(item.fireAt, nowMs)}
              </span>
              <IconControlButton
                iconId="account.profile.delete"
                preferAnimated={false}
                ariaLabel={t("settings.integrations.externalServices.queue.cancel")}
                testId={`external-services-queue-cancel-${item.jobId}`}
                onClick={() => onCancel(item.jobId)}
              />
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

function formatRemaining(fireAt: string, nowMs: number): string {
  const remainingMs = Math.max(0, Date.parse(fireAt) - nowMs);
  if (!Number.isFinite(remainingMs)) return "00:00";
  const totalSec = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

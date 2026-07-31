import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import { Switch } from "../../ui/index.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesAutomaticEventType =
  | "incoming_ringing"
  | "outgoing_connecting"
  | "call_answered"
  | "call_ended"
  | "call_rejected"
  | "call_missed"
  | "campaign_offered"
  | "campaign_accepted"
  | "campaign_rejected"
  | "acd_context_appeared";

const eventTypes: ReadonlyArray<ExternalServicesAutomaticEventType> = [
  "incoming_ringing",
  "outgoing_connecting",
  "call_answered",
  "call_ended",
  "call_rejected",
  "call_missed",
  "campaign_offered",
  "campaign_accepted",
  "campaign_rejected",
  "acd_context_appeared",
];

const triggerKeys: Readonly<Record<ExternalServicesAutomaticEventType, TranslationKey>> = {
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

export type ExternalServicesTriggerListProps = Readonly<{
  triggers: ReadonlyArray<Readonly<{
    eventType: ExternalServicesAutomaticEventType;
    delaySeconds: number;
  }>>;
  disabled: boolean;
  onChange: (triggers: ExternalServicesTriggerListProps["triggers"]) => void;
}>;

/**
 * - Purpose: edit automatic event trigger selection with compact delay control.
 * - Inputs: selected trigger bindings, disabled state, change callback.
 * - Outputs: trigger selection intent without event processing.
 * @uiMeta f=F-031
 */
export function ExternalServicesTriggerList({
  triggers,
  disabled,
  onChange,
}: ExternalServicesTriggerListProps): JSX.Element {
  const { t } = useI18n();
  return (
    <section className={styles.triggerList} data-testid="external-services-triggers">
      <h4 className={styles.triggerListTitle}>
        {t("settings.integrations.externalServices.editor.triggersTitle")}
      </h4>
      <p className={styles.description}>
        {t("settings.integrations.externalServices.editor.triggersHint")}
      </p>
      {eventTypes.map((eventType) => {
        const binding = triggers.find((trigger) => trigger.eventType === eventType);
        const checked = binding !== undefined;
        return (
          <div className={styles.triggerRow} key={eventType}>
            <span className={styles.triggerLabel}>{t(triggerKeys[eventType])}</span>
            <div className={styles.triggerControls}>
              {binding !== undefined ? (
                <label className={styles.triggerDelay}>
                  <span className={styles.triggerDelayLabel}>
                    {t("settings.integrations.externalServices.editor.triggerDelay")}
                  </span>
                  <input
                    className={styles.triggerDelayInput}
                    type="number"
                    min={0}
                    max={180}
                    step={1}
                    disabled={disabled}
                    aria-label={t("settings.integrations.externalServices.editor.triggerDelay")}
                    data-testid={`external-services-trigger-delay-${eventType}`}
                    value={binding.delaySeconds}
                    onChange={(event) => {
                      const value = Number(event.currentTarget.value);
                      if (!Number.isInteger(value) || value < 0 || value > 180) return;
                      onChange(
                        triggers.map((item) =>
                          item.eventType === eventType
                            ? { ...item, delaySeconds: value }
                            : item,
                        ),
                      );
                    }}
                  />
                  <span className={styles.triggerDelayUnit}>
                    {t("settings.integrations.externalServices.editor.triggerDelayUnit")}
                  </span>
                </label>
              ) : null}
              <Switch
                checked={checked}
                disabled={disabled}
                data-testid={`external-services-trigger-${eventType}`}
                aria-label={t(triggerKeys[eventType])}
                onCheckedChange={(enabled) =>
                  onChange(
                    enabled
                      ? [...triggers, { eventType, delaySeconds: 0 }]
                      : triggers.filter((item) => item.eventType !== eventType),
                  )
                }
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}

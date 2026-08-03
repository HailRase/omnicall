/**
 * - Purpose: illustrated radio cards for External Applications onCallEnded.
 * - Inputs: selected leave|minimize|close, busy/disabled flag, change callback.
 * - Outputs: accessible RadioGroup selection intents for draft update.
 */

import type { JSX, ReactNode } from "react";
import { useId } from "react";
import { useI18n } from "../../../i18n/index.js";
import { RadioGroup, RadioGroupItem } from "../../ui/index.js";
import styles from "./OnCallEndedChoiceCards.module.css";
import {
  buildOnCallEndedOptions,
  type OnCallEndedChoice,
} from "./onCallEndedOptions.js";

export type { OnCallEndedChoice };

export type OnCallEndedChoiceCardsProps = Readonly<{
  value: OnCallEndedChoice;
  disabled: boolean;
  onChange: (onCallEnded: OnCallEndedChoice) => void;
}>;

type OnCallEndedCardProps = Readonly<{
  value: OnCallEndedChoice;
  title: string;
  description: string;
  disabled: boolean;
  schematic: ReactNode;
}>;

function OnCallEndedCard({
  value,
  title,
  description,
  disabled,
  schematic,
}: OnCallEndedCardProps): JSX.Element {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <label className={styles.card} data-disabled={disabled ? "true" : undefined}>
      <div className={styles.cardHeader}>
        <RadioGroupItem
          value={value}
          disabled={disabled}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        />
        <span id={titleId} className={styles.cardTitle}>
          {title}
        </span>
      </div>
      <p id={descriptionId} className={styles.cardDescription}>
        {description}
      </p>
      <div className={styles.schematic} aria-hidden="true">
        {schematic}
      </div>
    </label>
  );
}

function handleOnCallEndedChange(
  next: string,
  onChange: (onCallEnded: OnCallEndedChoice) => void,
): void {
  if (next === "leave" || next === "minimize" || next === "close") {
    onChange(next);
  }
}

/**
 * @uiMeta f=F-032
 */
export function OnCallEndedChoiceCards({
  value,
  disabled,
  onChange,
}: OnCallEndedChoiceCardsProps): JSX.Element {
  const { t } = useI18n();
  const labelId = useId();
  const options = buildOnCallEndedOptions(t);

  return (
    <div className={styles.field}>
      <p id={labelId} className={styles.fieldLabel}>
        {t("settings.integrations.externalApplications.windowBehavior.onCallEnded")}
      </p>
      <RadioGroup
        value={value}
        disabled={disabled}
        orientation="horizontal"
        className={styles.group}
        aria-labelledby={labelId}
        data-testid="external-applications-on-call-ended"
        onValueChange={(next) => {
          handleOnCallEndedChange(next, onChange);
        }}
      >
        {options.map((option) => (
          <OnCallEndedCard
            key={option.value}
            value={option.value}
            disabled={disabled}
            title={option.title}
            description={option.description}
            schematic={option.schematic}
          />
        ))}
      </RadioGroup>
    </div>
  );
}

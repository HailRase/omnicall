import type { JSX } from "react";
import type { PhoneStatus } from "@application/index.js";
import { phoneStatusLabel } from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import panelStyles from "../shell/BootstrapPanel.module.css";
import styles from "./PhoneStatusBadge.module.css";

type PhoneStatusBadgeProps = Readonly<{
  status: PhoneStatus;
  registrationLabel: string;
  onChange: (status: PhoneStatus) => void;
  disabled?: boolean;
}>;

const STATUS_OPTIONS: ReadonlyArray<PhoneStatus> = ["dnd"];

export function PhoneStatusBadge({
  status,
  registrationLabel,
  onChange,
  disabled = false,
}: PhoneStatusBadgeProps): JSX.Element {
  const { t } = useI18n();
  return (
    <section className={panelStyles["panel"]} data-testid="phone-status-badge">
      <p>
        {t("status.phone.label")}: <strong>{phoneStatusLabel(status)}</strong>
      </p>
      <p>
        {t("status.phone.registration")}: <strong>{registrationLabel}</strong>
      </p>
      <div className={styles["actions"]} role="group" aria-label={t("status.phone.groupAria")}>
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            disabled={disabled}
            aria-pressed={status === option}
            data-testid={`phone-status-${option}`}
            onClick={() => {
              onChange(option);
            }}
          >
            {phoneStatusLabel(option)}
          </button>
        ))}
      </div>
    </section>
  );
}

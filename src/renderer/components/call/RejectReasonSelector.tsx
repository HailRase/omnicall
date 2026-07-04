import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";

export type RejectReasonSelectorProps = Readonly<{
  reasons: ReadonlyArray<string>;
  selectedReason: string | null;
  required: boolean;
  disabled: boolean;
  onSelect: (reason: string) => void;
}>;

export function RejectReasonSelector({
  reasons,
  selectedReason,
  required,
  disabled,
  onSelect,
}: RejectReasonSelectorProps): JSX.Element {
  const { t } = useI18n();
  return (
    <label>
      {t("call.rejectReason.label")}
      <select
        data-testid="reject-reason-select"
        aria-label={t("call.rejectReason.ariaLabel")}
        required={required}
        disabled={disabled}
        value={selectedReason ?? ""}
        onChange={(event) => {
          onSelect(event.target.value);
        }}
      >
        <option value="">{t("call.rejectReason.placeholder")}</option>
        {reasons.map((reason) => (
          <option key={reason} value={reason}>
            {reason}
          </option>
        ))}
      </select>
    </label>
  );
}

import type { JSX } from "react";

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
  return (
    <label>
      Reject reason
      <select
        data-testid="reject-reason-select"
        aria-label="Reject reason"
        required={required}
        disabled={disabled}
        value={selectedReason ?? ""}
        onChange={(event) => {
          onSelect(event.target.value);
        }}
      >
        <option value="">Select reason</option>
        {reasons.map((reason) => (
          <option key={reason} value={reason}>
            {reason}
          </option>
        ))}
      </select>
    </label>
  );
}

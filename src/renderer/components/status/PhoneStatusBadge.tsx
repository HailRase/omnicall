import type { JSX } from "react";
import type { PhoneStatus } from "@domain/index.js";
import { phoneStatusLabel } from "@domain/index.js";

type PhoneStatusBadgeProps = Readonly<{
  status: PhoneStatus;
  registrationLabel: string;
  onChange: (status: PhoneStatus) => void;
  disabled?: boolean;
}>;

const STATUS_OPTIONS: ReadonlyArray<PhoneStatus> = [
  "online",
  "offline",
  "dnd",
];

export function PhoneStatusBadge({
  status,
  registrationLabel,
  onChange,
  disabled = false,
}: PhoneStatusBadgeProps): JSX.Element {
  return (
    <section className="phone-status" data-testid="phone-status-badge">
      <p>
        Phone: <strong>{phoneStatusLabel(status)}</strong>
      </p>
      <p>
        Registration: <strong>{registrationLabel}</strong>
      </p>
      <div className="phone-status__actions" role="group" aria-label="Phone status">
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

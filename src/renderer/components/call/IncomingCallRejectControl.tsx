import type { JSX, MouseEvent } from "react";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu/DropdownMenu.js";

export type IncomingCallRejectControlProps = Readonly<{
  rejectDisabledReason: string | null;
  /** When true (OCP auth + break reasons), reject opens a choice menu. */
  rejectChoiceEnabled: boolean;
  onReject: () => void;
  onRejectWithoutBreak: () => void;
  onRejectWithBreak: () => void;
  /** Full button class list from the parent surface (session card / overlay). */
  className: string;
  /** Optional click stopper for nested overlay bodies that also handle clicks. */
  stopPropagationOnClick?: boolean;
}>;

/**
 * - Purpose: reject control with optional OCP without/with-break choice menu.
 * - Inputs: disabled reason, choice flag, plain reject and OCP choice callbacks.
 * - Outputs: icon button or DropdownMenu anchored to reject.
 * @uiMeta f=F-028
 */
export function IncomingCallRejectControl({
  rejectDisabledReason,
  rejectChoiceEnabled,
  onReject,
  onRejectWithoutBreak,
  onRejectWithBreak,
  className,
  stopPropagationOnClick = false,
}: IncomingCallRejectControlProps): JSX.Element {
  const { t } = useI18n();
  const disabled = rejectDisabledReason !== null;

  const handleStop = (event: MouseEvent<HTMLElement>): void => {
    if (stopPropagationOnClick) {
      event.stopPropagation();
    }
  };

  if (!rejectChoiceEnabled) {
    return (
      <button
        type="button"
        className={className}
        data-testid="reject-call"
        aria-label={t("incoming.rejectAria")}
        disabled={disabled}
        onClick={(event) => {
          handleStop(event);
          onReject();
        }}
      >
        <AppIcon id="call.reject" size={16} decorative />
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={className}
          data-testid="reject-call"
          aria-label={t("incoming.rejectAria")}
          disabled={disabled}
          onClick={handleStop}
        >
          <AppIcon id="call.reject" size={16} decorative />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={6}>
        <DropdownMenuItem
          data-testid="reject-call-without-break"
          destructive
          onSelect={() => {
            onRejectWithoutBreak();
          }}
        >
          {t("ocp.incomingCall.rejectWithoutBreak")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="reject-call-with-break"
          onSelect={() => {
            onRejectWithBreak();
          }}
        >
          {t("ocp.incomingCall.rejectWithBreakReason")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

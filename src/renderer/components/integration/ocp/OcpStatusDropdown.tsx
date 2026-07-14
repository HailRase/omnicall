import type { JSX } from "react";
import type { OcpStatusDropdownItemVm } from "../../../hooks/useOperatorStatusSelector.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import { useI18n } from "../../../i18n/index.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu/index.js";
import styles from "./OcpStatusDropdown.module.css";

export type OcpStatusDropdownProps = Readonly<{
  disabled: boolean;
  disabledReasonKey: TranslationKey | null;
  currentItems: ReadonlyArray<OcpStatusDropdownItemVm>;
  readyItems: ReadonlyArray<OcpStatusDropdownItemVm>;
  breakItems: ReadonlyArray<OcpStatusDropdownItemVm>;
  trigger: JSX.Element;
  onSelectReason: (targetStatus: "ready" | "break", reasonId: number) => void;
}>;

/**
 * - Purpose: Radix dropdown of Ready/Break OCP reasons for the header selector.
 * - Inputs: reason item VMs (current pinned first), disabled state, trigger, select callback.
 * - Outputs: accessible menu with current reason, then Ready/Break group subtitles.
 */
export function OcpStatusDropdown({
  disabled,
  currentItems,
  readyItems,
  breakItems,
  trigger,
  onSelectReason,
}: OcpStatusDropdownProps): JSX.Element {
  const { t } = useI18n();
  const hasOtherGroups = readyItems.length > 0 || breakItems.length > 0;

  return (
    <div className={styles.root}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          {trigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="bottom"
          data-testid="ocp-status-dropdown"
          className={styles.content}
        >
          {currentItems.length > 0 ? (
            <DropdownMenuGroup className={styles.group}>
              <DropdownMenuLabel className={styles.groupLabel}>
                {t("ocp.dropdown.currentGroup")}
              </DropdownMenuLabel>
              {currentItems.map((item) => (
                <DropdownMenuItem
                  key={`current-${item.targetStatus}-${item.reasonId}`}
                  className={styles.option}
                  disabled
                  data-testid="ocp-status-current"
                  aria-current="true"
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ) : null}
          {currentItems.length > 0 && hasOtherGroups ? (
            <DropdownMenuSeparator className={styles.separator} />
          ) : null}
          {readyItems.length > 0 ? (
            <DropdownMenuGroup className={styles.group}>
              <DropdownMenuLabel className={styles.groupLabel}>
                {t("ocp.dropdown.readyGroup")}
              </DropdownMenuLabel>
              {readyItems.map((item) => (
                <DropdownMenuItem
                  key={`ready-${item.reasonId}`}
                  className={styles.option}
                  disabled={item.disabled}
                  disabledReason={
                    item.disabled && item.disabledReasonKey !== null
                      ? t(item.disabledReasonKey)
                      : null
                  }
                  data-testid={item.testId ?? undefined}
                  onSelect={() => {
                    onSelectReason("ready", item.reasonId);
                  }}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ) : null}
          {readyItems.length > 0 && breakItems.length > 0 ? (
            <DropdownMenuSeparator className={styles.separator} />
          ) : null}
          {breakItems.length > 0 ? (
            <DropdownMenuGroup className={styles.group}>
              <DropdownMenuLabel className={styles.groupLabel}>
                {t("ocp.dropdown.breakGroup")}
              </DropdownMenuLabel>
              {breakItems.map((item) => (
                <DropdownMenuItem
                  key={`break-${item.reasonId}`}
                  className={styles.option}
                  onSelect={() => {
                    onSelectReason("break", item.reasonId);
                  }}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import clsx from "clsx";
import type { JSX } from "react";
import type {
  OcpStatusDropdownItemVm,
  PostCallFinishAppealVm,
} from "../../../hooks/useOperatorStatusSelector.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import { useI18n } from "../../../i18n/index.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu/index.js";
import styles from "./OcpStatusDropdown.module.css";

/** Max visible break reasons before the break list scrolls; Ready stays pinned above. */
export const OCP_STATUS_BREAK_VISIBLE_COUNT = 5;

export type OcpStatusDropdownProps = Readonly<{
  disabled: boolean;
  disabledReasonKey: TranslationKey | null;
  readyItems: ReadonlyArray<OcpStatusDropdownItemVm>;
  breakItems: ReadonlyArray<OcpStatusDropdownItemVm>;
  finishAppeal: PostCallFinishAppealVm;
  trigger: JSX.Element;
  onSelectReason: (targetStatus: "ready" | "break", reasonId: number) => void;
  onFinishAppeal: () => void;
}>;

function renderStatusOption(
  item: OcpStatusDropdownItemVm,
  targetStatus: "ready" | "break",
  t: (key: TranslationKey) => string,
  onSelectReason: (targetStatus: "ready" | "break", reasonId: number) => void,
): JSX.Element {
  const isCurrent = item.isCurrent;
  const isPolicyDisabled = item.disabled && !isCurrent;

  return (
    <DropdownMenuItem
      key={`${targetStatus}-${item.reasonId}`}
      className={clsx(
        styles.option,
        targetStatus === "ready" ? styles.optionReady : styles.optionBreak,
        isCurrent && styles.optionCurrent,
      )}
      disabled={isCurrent || item.disabled}
      disabledReason={
        isPolicyDisabled && item.disabledReasonKey !== null
          ? t(item.disabledReasonKey)
          : null
      }
      data-testid={item.testId ?? undefined}
      data-current={isCurrent ? "true" : undefined}
      aria-current={isCurrent ? "true" : undefined}
      onSelect={() => {
        if (isCurrent) {
          return;
        }
        onSelectReason(targetStatus, item.reasonId);
      }}
    >
      {item.label}
    </DropdownMenuItem>
  );
}

/**
 * - Purpose: Radix dropdown of Ready/Break OCP reasons for the header selector.
 * - Inputs: reason item VMs, optional post-call finish footer, disabled state, trigger, callbacks.
 * - Outputs: pinned Ready, separator, scrollable Break list, optional finish-appeal footer.
 */
export function OcpStatusDropdown({
  disabled,
  readyItems,
  breakItems,
  finishAppeal,
  trigger,
  onSelectReason,
  onFinishAppeal,
}: OcpStatusDropdownProps): JSX.Element {
  const { t } = useI18n();

  const finishStatusLabel =
    finishAppeal.statusLabel.length > 0
      ? finishAppeal.statusLabel
      : t("ocp.operatorStatus.ready");
  const finishLabel = t("ocp.postCall.finishAppeal", { status: finishStatusLabel });

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
          {readyItems.length > 0 ? (
            <DropdownMenuGroup
              className={styles.group}
              data-testid="ocp-status-dropdown-ready"
            >
              {readyItems.map((item) =>
                renderStatusOption(item, "ready", t, onSelectReason),
              )}
            </DropdownMenuGroup>
          ) : null}
          {readyItems.length > 0 && breakItems.length > 0 ? (
            <DropdownMenuSeparator className={styles.separator} />
          ) : null}
          {breakItems.length > 0 ? (
            <DropdownMenuGroup
              className={clsx(styles.group, styles.breakGroup)}
              data-testid="ocp-status-dropdown-breaks"
              data-visible-count={OCP_STATUS_BREAK_VISIBLE_COUNT}
            >
              {breakItems.map((item) =>
                renderStatusOption(item, "break", t, onSelectReason),
              )}
            </DropdownMenuGroup>
          ) : null}
          {finishAppeal.visible ? (
            <>
              <DropdownMenuSeparator className={styles.separator} />
              <div className={styles.finishFooter} data-testid="ocp-post-call-finish-footer">
                <DropdownMenuItem
                  className={styles.finishAppeal}
                  disabled={finishAppeal.disabled}
                  disabledReason={
                    finishAppeal.disabledReasonKey !== null
                      ? t(finishAppeal.disabledReasonKey)
                      : null
                  }
                  data-testid="ocp-post-call-finish-appeal"
                  onSelect={() => {
                    if (finishAppeal.disabled) {
                      return;
                    }
                    onFinishAppeal();
                  }}
                >
                  {finishLabel}
                </DropdownMenuItem>
              </div>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import type { JSX } from "react";
import { Button } from "../ui/button/Button.js";
import { useI18n } from "../../i18n/index.js";
import { ShellDialpadPanel } from "../shell/ShellDialpadPanel.js";
import type { ShellDialpadPanelPresentation } from "../shell/ShellDialpadPanel.js";
import type { CallHistoryEntryRowViewModel } from "../../hooks/useCallHistoryShell.js";
import styles from "./HistoryPanelShell.module.css";

export type HistoryPanelShellProps = Readonly<{
  open: boolean;
  presentation: ShellDialpadPanelPresentation;
  title: string;
  isLoading: boolean;
  isEmpty: boolean;
  errorMessage: string | null;
  rows: ReadonlyArray<CallHistoryEntryRowViewModel>;
  onClose: () => void;
  onRedial: (entryId: string) => void;
}>;

/**
 * - Purpose: present call history list inside shell overlay layer.
 * - Inputs: load/empty/error states, localized rows, and redial callbacks.
 * - Outputs: left slide-in history sidebar below window controls.
 * @uiMeta f=F-013 lf=LF-052,LF-053 smoke=history-panel
 */
export function HistoryPanelShell({
  open,
  presentation,
  title,
  isLoading,
  isEmpty,
  errorMessage,
  rows,
  onClose,
  onRedial,
}: HistoryPanelShellProps): JSX.Element | null {
  const { t } = useI18n();

  return (
    <ShellDialpadPanel
      open={open}
      title={title}
      testId="history-panel-shell"
      closeButtonTestId="history-panel-close"
      presentation={presentation}
      onClose={onClose}
    >
      {isLoading ? (
        <p className={styles.stateMessage} data-testid="history-panel-loading">
          {t("history.loading")}
        </p>
      ) : null}
      {!isLoading && errorMessage !== null ? (
        <p className={styles.stateMessageError} data-testid="history-panel-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {!isLoading && errorMessage === null && isEmpty ? (
        <p className={styles.stateMessage} data-testid="history-panel-empty">
          {t("history.empty")}
        </p>
      ) : null}
      {!isLoading && errorMessage === null && rows.length > 0 ? (
        <ul className={styles.list} data-testid="history-panel-list">
          {rows.map((row) => (
            <li key={row.id} className={styles.item} data-testid={`history-entry-${row.id}`}>
              <div className={styles.itemMain}>
                <div className={styles.number}>{row.remoteNumber}</div>
                {row.displayLabel !== null && row.displayLabel !== row.remoteNumber ? (
                  <div className={styles.subline}>{row.displayLabel}</div>
                ) : null}
                <div className={styles.meta}>
                  <span>{row.directionLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{row.outcomeLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{row.startedAtLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{row.durationLabel}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={row.redialDisabledReason !== null}
                title={row.redialDisabledReason ?? undefined}
                data-testid={`history-redial-${row.id}`}
                onClick={() => {
                  onRedial(row.id);
                }}
              >
                {t("history.redial")}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </ShellDialpadPanel>
  );
}

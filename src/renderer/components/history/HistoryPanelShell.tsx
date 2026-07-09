import clsx from "clsx";
import { useMemo, useState, type JSX, type ReactNode } from "react";
import { groupHistoryRowsByDate, type HistoryDateSection } from "../../helpers/groupHistoryRowsByDate.js";
import type { CallHistoryEntryRowViewModel } from "../../hooks/useCallHistoryShell.js";
import { useRestoreRouteFocus } from "../../hooks/useRestoreRouteFocus.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import { ListQuickCallReveal } from "../list/ListQuickCallReveal.js";
import { useListRowActionReveal } from "../../hooks/useListRowActionReveal.js";
import { PersonListAvatar } from "../list/PersonListAvatar.js";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs/Tabs.js";
import { ShellDialpadPanel } from "../shell/ShellDialpadPanel.js";
import type { ShellDialpadPanelPresentation } from "../shell/ShellDialpadPanel.js";
import styles from "./HistoryPanelShell.module.css";

export type HistoryPanelShellProps = Readonly<{
  open: boolean;
  presentation: ShellDialpadPanelPresentation;
  title: string;
  showBack?: boolean;
  onClose: () => void;
  onBack?: () => void;
  children?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  errorMessage?: string | null;
  rows?: ReadonlyArray<CallHistoryEntryRowViewModel>;
  restoreFocusEntryId?: string | null;
  onRestoreFocusHandled?: () => void;
  onSelectEntry?: (entryId: string) => void;
  onRedial?: (entryId: string) => void;
}>;

type HistoryFilter = "all" | "missed";

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
  showBack = false,
  onClose,
  onBack,
  children,
  isLoading = false,
  isEmpty = false,
  errorMessage = null,
  rows = [],
  restoreFocusEntryId = null,
  onRestoreFocusHandled,
  onSelectEntry,
  onRedial,
}: HistoryPanelShellProps): JSX.Element | null {
  const { t, language } = useI18n();
  const [filter, setFilter] = useState<HistoryFilter>("all");

  const filteredRows = useMemo(
    () => (filter === "missed" ? rows.filter((row) => row.isMissed) : rows),
    [filter, rows],
  );

  const sections = useMemo(
    () =>
      groupHistoryRowsByDate({
        rows: filteredRows,
        language,
        translate: (key) => t(key as Parameters<typeof t>[0]),
      }),
    [filteredRows, language, t],
  );

  const showFilter =
    children === undefined && !isLoading && errorMessage === null && !isEmpty;

  return (
    <ShellDialpadPanel
      open={open}
      title={title}
      testId="history-panel-shell"
      closeButtonTestId="history-panel-close"
      backButtonTestId="history-panel-back"
      presentation={presentation}
      showBack={showBack}
      onClose={onClose}
      {...(onBack !== undefined ? { onBack } : {})}
    >
      {children !== undefined ? (
        children
      ) : (
        <HistoryListBody
          filter={filter}
          setFilter={setFilter}
          showFilter={showFilter}
          isLoading={isLoading}
          isEmpty={isEmpty}
          errorMessage={errorMessage}
          sections={sections}
          filteredRows={filteredRows}
          restoreFocusEntryId={restoreFocusEntryId}
          {...(onRestoreFocusHandled !== undefined ? { onRestoreFocusHandled } : {})}
          {...(onSelectEntry !== undefined ? { onSelectEntry } : {})}
          {...(onRedial !== undefined ? { onRedial } : {})}
        />
      )}
    </ShellDialpadPanel>
  );
}

type HistoryListBodyProps = Readonly<{
  filter: HistoryFilter;
  setFilter: (value: HistoryFilter) => void;
  showFilter: boolean;
  isLoading: boolean;
  isEmpty: boolean;
  errorMessage: string | null;
  sections: ReadonlyArray<HistoryDateSection<CallHistoryEntryRowViewModel>>;
  filteredRows: ReadonlyArray<CallHistoryEntryRowViewModel>;
  restoreFocusEntryId?: string | null;
  onRestoreFocusHandled?: () => void;
  onSelectEntry?: (entryId: string) => void;
  onRedial?: (entryId: string) => void;
}>;

function HistoryListBody({
  filter,
  setFilter,
  showFilter,
  isLoading,
  isEmpty,
  errorMessage,
  sections,
  filteredRows,
  restoreFocusEntryId = null,
  onRestoreFocusHandled,
  onSelectEntry,
  onRedial,
}: HistoryListBodyProps): JSX.Element {
  const { t } = useI18n();

  useRestoreRouteFocus({
    targetTestId:
      restoreFocusEntryId !== null ? `history-entry-open-${restoreFocusEntryId}` : null,
    ...(onRestoreFocusHandled !== undefined ? { onHandled: onRestoreFocusHandled } : {}),
  });

  return (
    <>
      {showFilter ? (
        <div className={styles.filterRow}>
          <Tabs
            value={filter}
            onValueChange={(nextValue) => {
              if (nextValue === "all" || nextValue === "missed") {
                setFilter(nextValue);
              }
            }}
          >
            <TabsList aria-label={t("history.filter.ariaLabel")}>
              <TabsTrigger value="all" data-testid="history-filter-all">
                {t("history.filter.all")}
              </TabsTrigger>
              <TabsTrigger value="missed" data-testid="history-filter-missed">
                {t("history.filter.missed")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}

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
        <HistoryEmptyState />
      ) : null}

      {!isLoading && errorMessage === null && !isEmpty && filteredRows.length === 0 ? (
        <p className={styles.stateMessage} data-testid="history-panel-filter-empty">
          {t("history.filter.emptyMissed")}
        </p>
      ) : null}

      {!isLoading && errorMessage === null && sections.length > 0 ? (
        <div className={styles.sections} data-testid="history-panel-list">
          {sections.map((section) => (
            <section key={section.group.sortKey} className={styles.section}>
              <h3 className={styles.sectionTitle}>{section.group.label}</h3>
              <ul className={styles.list}>
                {section.rows.map((row) => (
                  <HistoryListRow
                    key={row.id}
                    row={row}
                    {...(onSelectEntry !== undefined ? { onSelectEntry } : {})}
                    {...(onRedial !== undefined ? { onRedial } : {})}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </>
  );
}

type HistoryListRowProps = Readonly<{
  row: CallHistoryEntryRowViewModel;
  onSelectEntry?: (entryId: string) => void;
  onRedial?: (entryId: string) => void;
}>;

function HistoryListRow({ row, onSelectEntry, onRedial }: HistoryListRowProps): JSX.Element {
  const { t } = useI18n();
  const { isActionVisible, rowInteractionProps } = useListRowActionReveal();
  const directionIconId = resolveDirectionIconId(row);
  const directionToneClass = resolveDirectionToneClass(row);

  return (
    <li
      className={styles.item}
      data-testid={`history-entry-${row.id}`}
      {...rowInteractionProps}
    >
      <button
        type="button"
        className={styles.itemSelect}
        data-testid={`history-entry-open-${row.id}`}
        onClick={() => {
          onSelectEntry?.(row.id);
        }}
      >
        <PersonListAvatar label={row.primaryLabel} size="sm" missed={row.isMissed} />
        <div className={styles.itemMain}>
          <div className={clsx(styles.primaryLine, row.isMissed && styles.primaryLineMissed)}>
            {row.primaryLabel}
          </div>
          <div className={styles.secondaryLine}>
            <span className={clsx(styles.directionIcon, directionToneClass)}>
              <AppIcon id={directionIconId} decorative size={14} />
            </span>
            <span>{row.directionLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{row.secondaryTimeLabel}</span>
          </div>
        </div>
      </button>
      <ListQuickCallReveal
        visible={isActionVisible}
        ariaLabel={t("history.redial")}
        testId={`history-redial-${row.id}`}
        disabledReason={row.redialDisabledReason}
        onClick={() => {
          onRedial?.(row.id);
        }}
      />
    </li>
  );
}

function HistoryEmptyState(): JSX.Element {
  const { t } = useI18n();

  return (
    <div className={styles.emptyState} data-testid="history-panel-empty">
      <AppIcon id="dial.call" decorative size={24} className={styles.emptyIcon} />
      <p className={styles.emptyTitle}>{t("history.empty")}</p>
      <p className={styles.emptyHint}>{t("history.emptyHint")}</p>
    </div>
  );
}

function resolveDirectionIconId(
  row: CallHistoryEntryRowViewModel,
): "call.incoming" | "call.outgoing" | "call.phone-off" {
  if (row.isMissed) {
    return "call.phone-off";
  }
  return row.direction === "incoming" ? "call.incoming" : "call.outgoing";
}

const DIRECTION_TONE_CLASS: Record<"incoming" | "outgoing" | "missed", string> = {
  incoming: styles.directionIncoming ?? "",
  outgoing: styles.directionOutgoing ?? "",
  missed: styles.directionMissed ?? "",
};

function resolveDirectionToneClass(row: CallHistoryEntryRowViewModel): string {
  if (row.isMissed) {
    return DIRECTION_TONE_CLASS.missed;
  }
  return DIRECTION_TONE_CLASS[row.direction];
}

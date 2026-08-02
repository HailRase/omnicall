import { useEffect, useMemo, useState, type JSX } from "react";
import {
  USER_NOTIFICATION_MODULE_FILTERS,
  createUserNotificationAccountFilter,
  type UserNotificationJournalQueryView,
  type UserNotificationJournalQueryViewInput,
  type UserNotificationModuleFilter,
} from "@application/projections/settings/userNotificationJournalViewModel.js";
import { useI18n } from "../../../i18n/index.js";
import { AppIcon } from "../../icons/index.js";
import { Button, Input, Select } from "../../ui/index.js";
import { NotificationHistoryTable } from "./NotificationHistoryTable.js";
import { MODULE_LABEL_KEY } from "./notificationPreferencesUi.js";
import styles from "./SettingsNotificationHistoryPanel.module.css";

const ALL = "__all__";
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

export type NotificationHistoryQuery = (
  input: UserNotificationJournalQueryViewInput,
) => Promise<UserNotificationJournalQueryView>;

type SettingsNotificationHistoryPanelProps = Readonly<{
  query: NotificationHistoryQuery;
}>;

export function SettingsNotificationHistoryPanel({
  query,
}: SettingsNotificationHistoryPanelProps): JSX.Element {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [accountKey, setAccountKey] = useState(ALL);
  const [module, setModule] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [outcome, setOutcome] =
    useState<UserNotificationJournalQueryView | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      const parsedModule = parseNotificationModule(module);
      void query({
        ...(accountKey !== ALL
          ? { accountKey: createUserNotificationAccountFilter(accountKey) }
          : {}),
        ...(parsedModule !== null ? { module: parsedModule } : {}),
        ...(search.trim().length > 0 ? { search } : {}),
        page,
        pageSize,
      })
        .then((next) => {
          if (!active) {
            return;
          }
          setOutcome(next);
          setFailed(false);
          if (next.pageCount > 0 && page > next.pageCount) {
            setPage(next.pageCount);
          }
        })
        .catch(() => {
          if (active) {
            setFailed(true);
          }
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [accountKey, module, page, pageSize, query, search]);

  const identityItems = useMemo(
    () => [
      { value: ALL, label: t("settings.notifications.filter.allUsers") },
      ...(outcome?.identities.map((identity) => ({
        value: identity.accountKey,
        label: identity.displayLabel,
      })) ?? []),
    ],
    [outcome?.identities, t],
  );
  const moduleItems = [
    { value: ALL, label: t("settings.notifications.filter.allModules") },
    ...USER_NOTIFICATION_MODULE_FILTERS.map((item) => ({
      value: item,
      label: t(MODULE_LABEL_KEY[item]),
    })),
  ];
  const pageCount = Math.max(1, outcome?.pageCount ?? 1);
  const pageItems = useMemo(
    () =>
      Array.from({ length: pageCount }, (_, index) => {
        const value = String(index + 1);
        return { value, label: value };
      }),
    [pageCount],
  );
  const pageSizeItems = PAGE_SIZE_OPTIONS.map((size) => ({
    value: String(size),
    label: String(size),
  }));

  return (
    <section className={styles.root} data-testid="settings-notification-history">
      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <p className={styles.fieldLabel} id="settings-notifications-search-label">
            {t("settings.notifications.search")}
          </p>
          <Input
            value={search}
            placeholder={t("settings.notifications.search")}
            aria-labelledby="settings-notifications-search-label"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className={styles.filterField}>
          <p className={styles.fieldLabel} id="settings-notifications-user-label">
            {t("settings.notifications.filter.user")}
          </p>
          <Select
            items={identityItems}
            value={accountKey}
            aria-labelledby="settings-notifications-user-label"
            onValueChange={(value) => {
              setAccountKey(value);
              setPage(1);
            }}
          />
        </div>
        <div className={styles.filterField}>
          <p className={styles.fieldLabel} id="settings-notifications-module-label">
            {t("settings.notifications.filter.module")}
          </p>
          <Select
            items={moduleItems}
            value={module}
            aria-labelledby="settings-notifications-module-label"
            data-testid="settings-notification-history-module"
            onValueChange={(value) => {
              setModule(value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className={styles.body}>
        {failed ? (
          <div
            className={styles.statusPanel}
            data-tone="danger"
            role="alert"
            data-testid="settings-notification-history-error"
          >
            <span className={styles.statusIcon} aria-hidden>
              <AppIcon id="notification.error" decorative size={20} />
            </span>
            <p className={styles.statusTitle}>
              {t("settings.notifications.loadFailed")}
            </p>
          </div>
        ) : outcome === null ? (
          <div
            className={styles.statusPanel}
            role="status"
            aria-live="polite"
            data-testid="settings-notification-history-loading"
          >
            <span className={styles.statusIcon} aria-hidden>
              <AppIcon id="settings.notifications" decorative size={20} />
            </span>
            <p className={styles.statusTitle}>{t("settings.notifications.loading")}</p>
          </div>
        ) : outcome.entries.length === 0 ? (
          <div
            className={styles.statusPanel}
            data-testid="settings-notification-history-empty"
          >
            <span className={styles.statusIcon} aria-hidden>
              <AppIcon id="settings.notifications" decorative size={20} />
            </span>
            <p className={styles.statusTitle}>{t("settings.notifications.empty")}</p>
            <p className={styles.statusHint}>
              {t("settings.notifications.emptyHint")}
            </p>
          </div>
        ) : (
          <NotificationHistoryTable entries={outcome.entries} />
        )}
      </div>

      {outcome !== null && !failed ? (
        <nav
          className={styles.pagination}
          aria-label={t("settings.notifications.pagination")}
        >
          <div className={styles.paginationMeta}>
            <span className={styles.paginationPage}>
              {t("settings.notifications.page")
                .replace("{page}", String(outcome.page))
                .replace("{pageCount}", String(outcome.pageCount))}
            </span>
            <span>
              {t("settings.notifications.results").replace(
                "{total}",
                String(outcome.total),
              )}
            </span>
          </div>
          <div className={styles.paginationControls}>
            <div className={styles.paginationSelect}>
              <p
                className={styles.fieldLabel}
                id="settings-notifications-page-label"
              >
                {t("settings.notifications.pageSelect")}
              </p>
              <Select
                items={pageItems}
                value={String(Math.min(page, pageCount))}
                aria-labelledby="settings-notifications-page-label"
                data-testid="settings-notification-history-page"
                onValueChange={(value) => {
                  const nextPage = Number.parseInt(value, 10);
                  if (Number.isFinite(nextPage) && nextPage >= 1) {
                    setPage(nextPage);
                  }
                }}
              />
            </div>
            <div className={styles.paginationSelect}>
              <p
                className={styles.fieldLabel}
                id="settings-notifications-page-size-label"
              >
                {t("settings.notifications.pageSize")}
              </p>
              <Select
                items={pageSizeItems}
                value={String(pageSize)}
                aria-labelledby="settings-notifications-page-size-label"
                data-testid="settings-notification-history-page-size"
                onValueChange={(value) => {
                  const nextSize = Number.parseInt(value, 10);
                  if (PAGE_SIZE_OPTIONS.some((size) => size === nextSize)) {
                    setPageSize(nextSize);
                    setPage(1);
                  }
                }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={outcome.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {t("settings.notifications.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={outcome.page >= outcome.pageCount}
              onClick={() =>
                setPage((current) => Math.min(outcome.pageCount, current + 1))
              }
            >
              {t("settings.notifications.next")}
            </Button>
          </div>
        </nav>
      ) : null}
    </section>
  );
}

function parseNotificationModule(
  value: string,
): UserNotificationModuleFilter | null {
  return USER_NOTIFICATION_MODULE_FILTERS.find((item) => item === value) ?? null;
}

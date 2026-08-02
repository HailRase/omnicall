import type { JSX } from "react";
import type { UserNotificationJournalQueryView } from "@application/projections/settings/userNotificationJournalViewModel.js";
import { useI18n } from "../../../i18n/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/index.js";
import type { BadgeTone } from "../../ui/types.js";
import { MODULE_LABEL_KEY } from "./notificationPreferencesUi.js";
import styles from "./SettingsNotificationHistoryPanel.module.css";

type JournalEntry = UserNotificationJournalQueryView["entries"][number];
type NotificationLevel = JournalEntry["level"];

const LEVEL_KEY: Record<NotificationLevel, TranslationKey> = {
  info: "settings.notifications.level.info",
  success: "settings.notifications.level.success",
  warning: "settings.notifications.level.warning",
  error: "settings.notifications.level.error",
};

const LEVEL_TONE: Record<NotificationLevel, BadgeTone> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "destructive",
};

type NotificationHistoryTableProps = Readonly<{
  entries: ReadonlyArray<JournalEntry>;
}>;

export function NotificationHistoryTable({
  entries,
}: NotificationHistoryTableProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className={styles.tableFrame}>
      <Table data-testid="settings-notification-history-table">
        <TableCaption>{t("settings.notifications.table.caption")}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{t("settings.notifications.column.time")}</TableHead>
            <TableHead>{t("settings.notifications.column.user")}</TableHead>
            <TableHead>{t("settings.notifications.column.title")}</TableHead>
            <TableHead>{t("settings.notifications.column.module")}</TableHead>
            <TableHead>{t("settings.notifications.column.level")}</TableHead>
            <TableHead>{t("settings.notifications.column.popup")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className={styles.timeCell}>
                <time dateTime={entry.emittedAt}>
                  {formatNotificationDate(entry.emittedAt)}
                </time>
              </TableCell>
              <TableCell className={styles.userCell}>
                {entry.accountDisplayLabel}
              </TableCell>
              <TableCell className={styles.titleCell}>
                {entry.titleSnapshot}
              </TableCell>
              <TableCell>
                <Badge tone="muted" size="sm">
                  {t(MODULE_LABEL_KEY[entry.module])}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge tone={LEVEL_TONE[entry.level]} size="sm">
                  {t(LEVEL_KEY[entry.level])}
                </Badge>
              </TableCell>
              <TableCell>
                {entry.suppressedAtEmission ? (
                  <Badge tone="warning" size="sm">
                    {t("settings.notifications.suppressed")}
                  </Badge>
                ) : (
                  <Badge tone="muted" size="sm">
                    {t("settings.notifications.popupShown")}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatNotificationDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "medium",
      }).format(date);
}

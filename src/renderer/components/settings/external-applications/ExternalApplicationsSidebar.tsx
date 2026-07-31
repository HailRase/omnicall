/**
 * - Purpose: select or create External Applications drafts.
 * - Inputs: configured applications, selection, busy state, action callbacks.
 * - Outputs: sidebar selection and item action intents.
 */

import type { JSX } from "react";
import clsx from "clsx";
import { useI18n } from "../../../i18n/index.js";
import { AppIcon } from "../../icons/AppIcon.js";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/index.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import styles from "./ExternalApplications.module.css";

export type ExternalApplicationsSidebarProps = Readonly<{
  applications: ReadonlyArray<ExternalApplicationsPanelApplication>;
  selectedId: ExternalApplicationsPanelApplication["id"] | null;
  busy: boolean;
  onSelect: (id: ExternalApplicationsPanelApplication["id"]) => void;
  onCreate: () => void;
  onToggle: (id: ExternalApplicationsPanelApplication["id"], enabled: boolean) => void;
  onRename: (id: ExternalApplicationsPanelApplication["id"]) => void;
  onDuplicate: (id: ExternalApplicationsPanelApplication["id"]) => void;
  onDelete: (id: ExternalApplicationsPanelApplication["id"]) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsSidebar({
  applications,
  selectedId,
  busy,
  onSelect,
  onCreate,
  onToggle,
  onRename,
  onDuplicate,
  onDelete,
}: ExternalApplicationsSidebarProps): JSX.Element {
  const { t } = useI18n();

  return (
    <aside
      className={styles.sidebar}
      aria-label={t("settings.integrations.externalApplications.title")}
      data-testid="external-applications-sidebar"
    >
      <ul className={styles.applicationList}>
        {applications.map((application) => {
          const selected = application.id === selectedId;
          return (
            <li key={application.id}>
              <div
                className={clsx(styles.applicationRow, selected && styles.applicationRowSelected)}
                data-testid={`external-applications-item-${application.id}`}
              >
                <span
                  className={clsx(
                    styles.applicationStatusDot,
                    application.enabled
                      ? styles.applicationStatusDotOn
                      : styles.applicationStatusDotOff,
                  )}
                  aria-hidden="true"
                  data-testid={`external-applications-status-${application.id}`}
                />
                <button
                  type="button"
                  className={styles.applicationButton}
                  aria-current={selected ? "page" : undefined}
                  disabled={busy}
                  onClick={() => {
                    onSelect(application.id);
                  }}
                >
                  <span
                    className={clsx(
                      styles.applicationName,
                      !application.enabled && styles.applicationNameDisabled,
                    )}
                  >
                    {application.name}
                  </span>
                </button>
                <div className={styles.applicationRowActions}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={styles.applicationMenuTrigger}
                        disabled={busy}
                        aria-label={t("settings.integrations.externalApplications.actions.menu")}
                        data-testid={`external-applications-menu-${application.id}`}
                      >
                        ⋯
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        disabled={busy}
                        onSelect={() => {
                          onToggle(application.id, !application.enabled);
                        }}
                      >
                        {t(
                          application.enabled
                            ? "settings.integrations.externalApplications.actions.disable"
                            : "settings.integrations.externalApplications.actions.enable",
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={busy}
                        onSelect={() => {
                          onRename(application.id);
                        }}
                      >
                        {t("settings.integrations.externalApplications.actions.rename")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={busy}
                        onSelect={() => {
                          onDuplicate(application.id);
                        }}
                      >
                        {t("settings.integrations.externalApplications.actions.duplicate")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={busy}
                        destructive
                        onSelect={() => {
                          onDelete(application.id);
                        }}
                      >
                        {t("settings.integrations.externalApplications.actions.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className={styles.sidebarFooter}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={styles.sidebarAddButton}
          disabled={busy}
          data-testid="external-applications-add"
          onClick={onCreate}
        >
          <AppIcon
            id="settings.integrations.external-services.add"
            size={14}
            decorative
            preferAnimated={false}
          />
          {t("settings.integrations.externalApplications.add")}
        </Button>
      </div>
    </aside>
  );
}

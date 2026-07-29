import type { JSX } from "react";
import type { ExternalServicesCollectionSummaryVm } from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Switch,
} from "../../ui/index.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesCollectionRowProps = Readonly<{
  collection: ExternalServicesCollectionSummaryVm;
  disabled: boolean;
  onToggle: (enabled: boolean) => void;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onEditVariables: () => void;
  onDelete: () => void;
}>;

/**
 * - Purpose: render one External Services collection summary row.
 * - Inputs: summary VM and collection intent callbacks.
 * - Outputs: accessible row with toggle, count badge, open, and overflow menu.
 * @uiMeta f=F-031
 */
export function ExternalServicesCollectionRow({
  collection,
  disabled,
  onToggle,
  onOpen,
  onRename,
  onDuplicate,
  onExport,
  onEditVariables,
  onDelete,
}: ExternalServicesCollectionRowProps): JSX.Element {
  const { t } = useI18n();
  const toggleLabel = t("settings.integrations.externalServices.collections.toggleLabel", {
    name: collection.name,
  });

  return (
    <li
      className={styles.row}
      data-testid={`external-services-collection-${collection.id}`}
    >
      <div className={styles.rowMain}>
        <p className={styles.rowName}>{collection.name}</p>
        <div className={styles.rowMeta}>
          <Badge
            tone={collection.enabled ? "success" : "muted"}
            size="sm"
            data-testid={`external-services-collection-enabled-count-${collection.id}`}
          >
            {t("settings.integrations.externalServices.collections.enabledCount", {
              enabled: collection.enabledRequestCount,
              total: collection.requestCount,
            })}
          </Badge>
        </div>
      </div>
      <div className={styles.rowActions}>
        <Switch
          checked={collection.enabled}
          disabled={disabled}
          aria-label={toggleLabel}
          data-testid={`external-services-collection-toggle-${collection.id}`}
          onCheckedChange={onToggle}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onOpen}
        >
          {t("settings.integrations.externalServices.actions.open")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-label={t("settings.integrations.externalServices.actions.menu")}
              data-testid={`external-services-collection-menu-${collection.id}`}
            >
              ⋯
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={disabled}
              onSelect={() => {
                onRename();
              }}
            >
              {t("settings.integrations.externalServices.actions.rename")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={disabled}
              onSelect={() => {
                onEditVariables();
              }}
            >
              {t("settings.integrations.externalServices.actions.editVariables")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={disabled}
              onSelect={() => {
                onDuplicate();
              }}
            >
              {t("settings.integrations.externalServices.actions.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={disabled}
              onSelect={() => {
                onExport();
              }}
            >
              {t("settings.integrations.externalServices.actions.export")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={disabled}
              destructive
              onSelect={() => {
                onDelete();
              }}
            >
              {t("settings.integrations.externalServices.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

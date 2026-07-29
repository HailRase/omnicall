import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
} from "../../ui/index.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesRequestSummary = Readonly<{
  id: string;
  name: string;
  enabled: boolean;
  method: string;
}>;

export type ExternalServicesRequestRowProps = Readonly<{
  request: ExternalServicesRequestSummary;
  disabled: boolean;
  onOpen: () => void;
  onToggle: (enabled: boolean) => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}>;

/** - Purpose: render one request summary and its UI intents.
 * - Inputs: request projection, disabled state, callbacks.
 * - Outputs: accessible request row without application access.
 * @uiMeta f=F-031
 */
export function ExternalServicesRequestRow({
  request,
  disabled,
  onOpen,
  onToggle,
  onRename,
  onDuplicate,
  onDelete,
}: ExternalServicesRequestRowProps): JSX.Element {
  const { t } = useI18n();
  return (
    <li className={styles.row} data-testid={`external-services-request-${request.id}`}>
      <div className={styles.rowMain}>
        <p className={styles.rowName}>{request.name}</p>
        <div className={styles.rowMeta}>
          <Badge tone="muted" size="sm">{request.method}</Badge>
          <Badge
            tone={request.enabled ? "success" : "muted"}
            size="sm"
            data-testid={`external-services-request-status-${request.id}`}
          >
            {t(
              request.enabled
                ? "settings.integrations.externalServices.requests.statusEnabled"
                : "settings.integrations.externalServices.requests.statusDisabled",
            )}
          </Badge>
        </div>
      </div>
      <div className={styles.rowActions}>
        <Switch
          checked={request.enabled}
          disabled={disabled}
          aria-label={t("settings.integrations.externalServices.requests.toggleLabel", {
            name: request.name,
          })}
          data-testid={`external-services-request-toggle-${request.id}`}
          onCheckedChange={onToggle}
        />
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onOpen}>
          {t("settings.integrations.externalServices.actions.open")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-label={t("settings.integrations.externalServices.requests.menuLabel")}
            >
              ⋯
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onRename}>
              {t("settings.integrations.externalServices.actions.rename")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>
              {t("settings.integrations.externalServices.actions.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={onDelete}>
              {t("settings.integrations.externalServices.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
} from "../../ui/index.js";
import {
  ExternalServicesCollectionsDialogs,
  type ExternalServicesCollectionsDialogsProps,
} from "./ExternalServicesCollectionsDialogs.js";
import type { ExternalServicesRequestEditorProps } from "./ExternalServicesRequestEditor.js";
import { ExternalServicesRequestEditor } from "./ExternalServicesRequestEditor.js";
import type { ExternalServicesRequestsViewProps } from "./ExternalServicesRequestsView.js";
import { ExternalServicesRequestsView } from "./ExternalServicesRequestsView.js";
import type { ExternalServicesSidebarProps } from "./ExternalServicesSidebar.js";
import { ExternalServicesSidebar } from "./ExternalServicesSidebar.js";
import type { ExternalServicesVariablesDialogProps } from "./ExternalServicesVariablesDialog.js";
import { ExternalServicesVariablesDialog } from "./ExternalServicesVariablesDialog.js";
import type { ExternalServicesWelcomeProps } from "./ExternalServicesWelcome.js";
import { ExternalServicesWelcome } from "./ExternalServicesWelcome.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesPanelProps = Readonly<{
  sidebar: ExternalServicesSidebarProps;
  welcome: ExternalServicesWelcomeProps | null;
  requestsView: ExternalServicesRequestsViewProps | null;
  requestEditor: ExternalServicesRequestEditorProps | null;
  loadErrorMessage: string | null;
  statusMessage: string | null;
  onRetryLoad: () => void;
  dialogs: ExternalServicesCollectionsDialogsProps;
  variablesDialog: ExternalServicesVariablesDialogProps | null;
}>;

/**
 * - Purpose: Postman-like External Services Settings workspace shell.
 * - Inputs: sidebar, welcome/collection/editor panes, load banner, dialogs, variables dialog.
 * - Outputs: composed Settings UI without facade or Domain access.
 * @uiMeta f=F-031
 */
export function ExternalServicesPanel({
  sidebar,
  welcome,
  requestsView,
  requestEditor,
  loadErrorMessage,
  statusMessage,
  onRetryLoad,
  dialogs,
  variablesDialog,
}: ExternalServicesPanelProps): JSX.Element {
  const { t } = useI18n();
  const showBanner = loadErrorMessage !== null || statusMessage !== null;

  return (
    <div className={styles.workspace} data-testid="external-services-workspace">
      {showBanner ? (
        <div className={styles.workspaceBanner} data-testid="external-services-workspace-banner">
          {loadErrorMessage !== null ? (
            <Alert
              variant="destructive"
              data-testid="external-services-load-error"
            >
              <AlertTitle>{loadErrorMessage}</AlertTitle>
              <AlertDescription>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="external-services-load-retry"
                  onClick={onRetryLoad}
                >
                  {t("settings.integrations.externalServices.actions.retry")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          {statusMessage !== null ? (
            <p className={styles.workspaceStatus} role="status">
              {statusMessage}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className={styles.workspaceBody} data-testid="external-services-workspace-body">
        <ExternalServicesSidebar {...sidebar} />
        <div className={styles.mainPane}>
          {requestEditor !== null ? (
            <ExternalServicesRequestEditor {...requestEditor} />
          ) : requestsView !== null ? (
            <ExternalServicesRequestsView {...requestsView} />
          ) : welcome !== null ? (
            <ExternalServicesWelcome {...welcome} />
          ) : null}
        </div>
      </div>
      <ExternalServicesCollectionsDialogs {...dialogs} />
      {variablesDialog !== null ? (
        <ExternalServicesVariablesDialog {...variablesDialog} />
      ) : null}
    </div>
  );
}

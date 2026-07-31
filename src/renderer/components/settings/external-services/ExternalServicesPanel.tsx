import type { JSX } from "react";
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
  dialogs: ExternalServicesCollectionsDialogsProps;
  variablesDialog: ExternalServicesVariablesDialogProps | null;
}>;

/**
 * - Purpose: Postman-like External Services Settings workspace shell.
 * - Inputs: sidebar, welcome/collection/editor panes, dialogs, variables dialog.
 * - Outputs: composed Settings UI without facade or Domain access.
 * @uiMeta f=F-031
 */
export function ExternalServicesPanel({
  sidebar,
  welcome,
  requestsView,
  requestEditor,
  dialogs,
  variablesDialog,
}: ExternalServicesPanelProps): JSX.Element {
  return (
    <div className={styles.workspace} data-testid="external-services-workspace">
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
      <ExternalServicesCollectionsDialogs {...dialogs} />
      {variablesDialog !== null ? <ExternalServicesVariablesDialog {...variablesDialog} /> : null}
    </div>
  );
}

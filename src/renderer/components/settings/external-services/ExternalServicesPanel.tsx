import type { JSX } from "react";
import type { ExternalServicesCollectionsViewProps } from "./ExternalServicesCollectionsView.js";
import { ExternalServicesCollectionsView } from "./ExternalServicesCollectionsView.js";
import type { ExternalServicesRequestEditorProps } from "./ExternalServicesRequestEditor.js";
import { ExternalServicesRequestEditor } from "./ExternalServicesRequestEditor.js";
import type { ExternalServicesRequestsViewProps } from "./ExternalServicesRequestsView.js";
import { ExternalServicesRequestsView } from "./ExternalServicesRequestsView.js";
import type { ExternalServicesVariablesDialogProps } from "./ExternalServicesVariablesDialog.js";
import { ExternalServicesVariablesDialog } from "./ExternalServicesVariablesDialog.js";

export type ExternalServicesPanelProps = Readonly<{
  collectionsView: ExternalServicesCollectionsViewProps;
  requestsView?: ExternalServicesRequestsViewProps | null;
  requestEditor?: ExternalServicesRequestEditorProps | null;
  variablesDialog: ExternalServicesVariablesDialogProps | null;
}>;

/**
 * - Purpose: present External Services Settings leaf content.
 * - Inputs: presentational collections view and optional variables dialog props.
 * - Outputs: composed Settings UI without facade or Domain access.
 * @uiMeta f=F-031
 */
export function ExternalServicesPanel({
  collectionsView,
  requestsView = null,
  requestEditor = null,
  variablesDialog,
}: ExternalServicesPanelProps): JSX.Element {
  return (
    <>
      {requestsView !== null ? (
        <ExternalServicesRequestsView {...requestsView} />
      ) : requestEditor !== null ? (
        <ExternalServicesRequestEditor {...requestEditor} />
      ) : (
        <ExternalServicesCollectionsView {...collectionsView} />
      )}
      {variablesDialog !== null ? (
        <ExternalServicesVariablesDialog {...variablesDialog} />
      ) : null}
    </>
  );
}

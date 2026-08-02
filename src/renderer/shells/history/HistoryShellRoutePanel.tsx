import type { JSX } from "react";
import { useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { isErr } from "@shared/result/index.js";
import { HistoryDetailPanel } from "../../components/history/HistoryDetailPanel.js";
import { HistoryDeleteConfirmationModal } from "../../components/history/HistoryDeleteConfirmationModal.js";
import { HistoryPanelShell } from "../../components/history/HistoryPanelShell.js";
import { useAuthShellFlags } from "../../hooks/useAuthShellFlags.js";
import { useCallHistoryActions } from "../../hooks/useCallHistoryActions.js";
import { useCallHistoryDetailShell } from "../../hooks/useCallHistoryDetailShell.js";
import { useCallHistoryShell } from "../../hooks/useCallHistoryShell.js";
import type { NotificationDescriptor } from "../../hooks/useNotifications.js";
import { NEW_CONTACT_ROUTE_ID } from "../../hooks/useContactEditShell.js";
import { useShellNavigation } from "../../navigation/useShellNavigation.js";
import { useShellRouteDataStore } from "../../navigation/routeData/useShellRouteDataStore.js";
import { useDialogReturnFocus } from "../../hooks/useDialogReturnFocus.js";
import { useI18n } from "../../i18n/index.js";

type HistoryShellRoutePanelProps = Readonly<{
  facade: AccountBootstrapFacade;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

/**
 * - Purpose: render history list and detail routes over mounted dialpad/call shell.
 * - Inputs: account bootstrap facade and active hash history routes.
 * - Outputs: localized history overlay wired to list/detail/redial actions.
 */
export function HistoryShellRoutePanel({
  facade,
  notify,
}: HistoryShellRoutePanelProps): JSX.Element | null {
  const { route, navigateTo, goToDialpad } = useShellNavigation();
  const [restoreFocusEntryId, setRestoreFocusEntryId] = useState<string | null>(null);

  if (route.name !== "history" && route.name !== "historyDetails") {
    return null;
  }

  if (route.name === "history") {
    return (
      <HistoryListRoute
        facade={facade}
        restoreFocusEntryId={restoreFocusEntryId}
        onRestoreFocusHandled={() => {
          setRestoreFocusEntryId(null);
        }}
        onClose={goToDialpad}
        {...(notify !== undefined ? { notify } : {})}
      />
    );
  }

  return (
    <HistoryDetailsRoute
      facade={facade}
      entryId={route.entryId}
      routeNotFound={route.notFound}
      onReturnToList={(entryId) => {
        setRestoreFocusEntryId(entryId);
        navigateTo({ name: "history" });
      }}
      onClose={goToDialpad}
      onBack={() => {
        setRestoreFocusEntryId(route.entryId);
        navigateTo({ name: "history" });
      }}
      {...(notify !== undefined ? { notify } : {})}
    />
  );
}

type HistoryListRouteProps = Readonly<{
  facade: AccountBootstrapFacade;
  restoreFocusEntryId: string | null;
  onRestoreFocusHandled: () => void;
  notify?: (descriptor: NotificationDescriptor) => void;
  onClose: () => void;
}>;

function HistoryListRoute({
  facade,
  restoreFocusEntryId,
  onRestoreFocusHandled,
  notify,
  onClose,
}: HistoryListRouteProps): JSX.Element {
  const { t } = useI18n();
  const { presentation, navigateTo, goToDialpad } = useShellNavigation();
  const { isSipRegistered } = useAuthShellFlags();
  const actions = useCallHistoryActions({
    facade,
    ...(notify !== undefined ? { notify } : {}),
  });
  const historyShell = useCallHistoryShell({
    isSipRegistered,
  });

  return (
    <HistoryPanelShell
      open
      presentation={presentation === "fullPanel" ? "fullPanel" : "sidebar"}
      title={t("history.title")}
      isLoading={historyShell.isLoading}
      isEmpty={historyShell.isEmpty}
      errorMessage={historyShell.errorMessage}
      rows={historyShell.rows}
      restoreFocusEntryId={restoreFocusEntryId}
      onRestoreFocusHandled={onRestoreFocusHandled}
      onClose={onClose}
      onSelectEntry={(entryId) => {
        navigateTo({ name: "historyDetails", entryId });
      }}
      onRedial={(entryId) => {
        void (async () => {
          const result = await actions.redialEntry(entryId);
          if (!isErr(result)) {
            goToDialpad();
          }
        })();
      }}
    />
  );
}

type HistoryDetailsRouteProps = Readonly<{
  facade: AccountBootstrapFacade;
  entryId: string;
  routeNotFound: boolean;
  notify?: (descriptor: NotificationDescriptor) => void;
  onReturnToList: (entryId: string) => void;
  onClose: () => void;
  onBack: () => void;
}>;

function HistoryDetailsRoute({
  facade,
  entryId,
  routeNotFound,
  notify,
  onReturnToList,
  onClose,
  onBack,
}: HistoryDetailsRouteProps): JSX.Element {
  const { t } = useI18n();
  const { presentation, goToDialpad, navigateTo } = useShellNavigation();
  const { isSipRegistered } = useAuthShellFlags();
  const { triggerRef: deleteTriggerRef, onCloseAutoFocus } =
    useDialogReturnFocus<HTMLButtonElement>();
  const actions = useCallHistoryActions({
    facade,
    ...(notify !== undefined ? { notify } : {}),
  });
  const detailShell = useCallHistoryDetailShell({
    entryId,
    routeNotFound,
    isSipRegistered,
    actions,
  });

  const title = detailShell.entry?.primaryLabel ?? t("history.detail.title");

  return (
    <>
      <HistoryPanelShell
        open
        presentation={presentation === "fullPanel" ? "fullPanel" : "sidebar"}
        title={title}
        showBack
        onClose={onClose}
        onBack={onBack}
      >
        <HistoryDetailPanel
          isLoading={detailShell.isLoading}
          isNotFound={detailShell.isNotFound}
          entry={detailShell.entry}
          deleteButtonRef={deleteTriggerRef}
          onRedial={() => {
            void (async () => {
              const result = await actions.redialEntry(entryId);
              if (!isErr(result)) {
                goToDialpad();
              }
            })();
          }}
          onContactAction={() => {
            const entry = detailShell.entry;
            if (entry === null) {
              return;
            }

            if (entry.contactId !== null) {
              useShellRouteDataStore.getState().clearContactCreatePrefill();
              navigateTo({ name: "contactDetails", contactId: entry.contactId });
              return;
            }

            useShellRouteDataStore.getState().setContactCreatePrefill({
              displayName: entry.presentationSource === "sip" ? entry.primaryLabel : "",
              primaryPhone: entry.remoteNumber,
            });
            navigateTo({ name: "contactEdit", contactId: NEW_CONTACT_ROUTE_ID });
          }}
          onDelete={detailShell.openDeleteConfirmation}
        />
      </HistoryPanelShell>
      <HistoryDeleteConfirmationModal
        open={detailShell.deleteConfirmationOpen}
        entryLabel={detailShell.entry?.primaryLabel ?? null}
        isDeleting={detailShell.isDeleting}
        onCloseAutoFocus={onCloseAutoFocus}
        onCancel={detailShell.closeDeleteConfirmation}
        onConfirm={() => {
          void (async () => {
            const deleted = await detailShell.confirmDelete();
            if (deleted) {
              onReturnToList(entryId);
            }
          })();
        }}
      />
    </>
  );
}

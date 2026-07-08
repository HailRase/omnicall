import type { JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { isErr } from "@shared/result/index.js";
import { HistoryDetailPanel } from "../../components/history/HistoryDetailPanel.js";
import { HistoryPanelShell } from "../../components/history/HistoryPanelShell.js";
import { useAuthShellFlags } from "../../hooks/useAuthShellFlags.js";
import { useCallHistoryActions } from "../../hooks/useCallHistoryActions.js";
import { useCallHistoryDetailShell } from "../../hooks/useCallHistoryDetailShell.js";
import { useCallHistoryShell } from "../../hooks/useCallHistoryShell.js";
import type { NotificationDescriptor } from "../../hooks/useNotifications.js";
import { useShellNavigation } from "../../navigation/useShellNavigation.js";
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

  if (route.name !== "history" && route.name !== "historyDetails") {
    return null;
  }

  if (route.name === "history") {
    return (
      <HistoryListRoute
        facade={facade}
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
      onClose={goToDialpad}
      onBack={() => {
        navigateTo({ name: "history" });
      }}
      {...(notify !== undefined ? { notify } : {})}
    />
  );
}

type HistoryListRouteProps = Readonly<{
  facade: AccountBootstrapFacade;
  notify?: (descriptor: NotificationDescriptor) => void;
  onClose: () => void;
}>;

function HistoryListRoute({ facade, notify, onClose }: HistoryListRouteProps): JSX.Element {
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
  onClose: () => void;
  onBack: () => void;
}>;

function HistoryDetailsRoute({
  facade,
  entryId,
  routeNotFound,
  notify,
  onClose,
  onBack,
}: HistoryDetailsRouteProps): JSX.Element {
  const { t } = useI18n();
  const { presentation, goToDialpad } = useShellNavigation();
  const { isSipRegistered } = useAuthShellFlags();
  const actions = useCallHistoryActions({
    facade,
    ...(notify !== undefined ? { notify } : {}),
  });
  const detailShell = useCallHistoryDetailShell({
    entryId,
    routeNotFound,
    isSipRegistered,
  });

  const title = detailShell.entry?.primaryLabel ?? t("history.detail.title");

  return (
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
        onRedial={() => {
          void (async () => {
            const result = await actions.redialEntry(entryId);
            if (!isErr(result)) {
              goToDialpad();
            }
          })();
        }}
      />
    </HistoryPanelShell>
  );
}

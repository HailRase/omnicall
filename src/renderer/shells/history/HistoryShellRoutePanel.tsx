import type { JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { isErr } from "@shared/result/index.js";
import { HistoryPanelShell } from "../../components/history/HistoryPanelShell.js";
import { useAuthShellFlags } from "../../hooks/useAuthShellFlags.js";
import { useCallHistoryActions } from "../../hooks/useCallHistoryActions.js";
import { useCallHistoryShell } from "../../hooks/useCallHistoryShell.js";
import type { NotificationDescriptor } from "../../hooks/useNotifications.js";
import { useShellNavigation } from "../../navigation/useShellNavigation.js";
import { useI18n } from "../../i18n/index.js";

type HistoryShellRoutePanelProps = Readonly<{
  facade: AccountBootstrapFacade;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

/**
 * - Purpose: render history route panel over mounted dialpad/call shell.
 * - Inputs: account bootstrap facade and active hash history route.
 * - Outputs: localized history overlay wired to list/redial actions.
 */
export function HistoryShellRoutePanel({
  facade,
  notify,
}: HistoryShellRoutePanelProps): JSX.Element | null {
  const { t } = useI18n();
  const { route, presentation, goToDialpad } = useShellNavigation();
  const { isSipRegistered } = useAuthShellFlags();
  const actions = useCallHistoryActions({
    facade,
    ...(notify !== undefined ? { notify } : {}),
  });
  const historyShell = useCallHistoryShell({
    isSipRegistered,
  });

  if (route.name !== "history") {
    return null;
  }

  return (
    <HistoryPanelShell
      open
      presentation={presentation === "fullPanel" ? "fullPanel" : "sidebar"}
      title={t("history.title")}
      isLoading={historyShell.isLoading}
      isEmpty={historyShell.isEmpty}
      errorMessage={historyShell.errorMessage}
      rows={historyShell.rows}
      onClose={goToDialpad}
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

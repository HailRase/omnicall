import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog/index.js";
import { Button } from "../../ui/button/index.js";
import styles from "./OcpProxyStatusScreen.module.css";

type OcpProxyBlockingStatus = "SESSION_EXIST" | "INVALID_TOKEN";

export type OcpProxyStatusScreenProps = Readonly<{
  proxyStatus: OcpProxyBlockingStatus | null;
  onOpenIntegrations: () => void;
}>;

/**
 * - Purpose: blocking overlay for OCP SESSION_EXIST / INVALID_TOKEN proxy errors.
 * - Inputs: proxy status and navigate-to-Integrations callback.
 * - Outputs: Dialog forcing operator to fix token/session in Settings.
 */
export function OcpProxyStatusScreen({
  proxyStatus,
  onOpenIntegrations,
}: OcpProxyStatusScreenProps): JSX.Element | null {
  const { t } = useI18n();

  if (proxyStatus === null) {
    return null;
  }

  const titleKey =
    proxyStatus === "SESSION_EXIST"
      ? "ocp.proxyStatus.sessionExist.title"
      : "ocp.proxyStatus.invalidToken.title";
  const messageKey =
    proxyStatus === "SESSION_EXIST"
      ? "ocp.proxyStatus.sessionExist.message"
      : "ocp.proxyStatus.invalidToken.message";

  return (
    <Dialog open>
      <DialogContent
        className={styles.content}
        data-testid="ocp-proxy-status-screen"
        data-proxy-status={proxyStatus}
        showCloseButton={false}
        closeLabel={t("ocp.proxyStatus.openSettings")}
        onPointerDownOutside={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t(messageKey)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="primary"
            data-testid="ocp-proxy-open-integrations"
            onClick={onOpenIntegrations}
          >
            {t("ocp.proxyStatus.openSettings")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

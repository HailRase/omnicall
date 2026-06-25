import { type JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { AuthStateView } from "../components/auth/AuthStateView.js";
import { PhoneStatusBadge } from "../components/status/PhoneStatusBadge.js";
import { OcpToastStack } from "../components/ocp/OcpToastStack.js";
import { registrationLabel } from "../helpers/registrationLabel.js";
import { useAuthShellFlags } from "../hooks/useAuthShellFlags.js";
import { useOcpNotifications } from "../hooks/useOcpNotifications.js";
import { usePhoneStatusActions } from "../hooks/usePhoneStatusActions.js";
import type { UseSessionLogoutActionsResult } from "../hooks/useSessionLogoutActions.js";
import { useSoftphoneProjections } from "../hooks/useSoftphoneProjections.js";
import { AuthAccountShell } from "./AuthAccountShell.js";
import { CallFeatureShell } from "./CallFeatureShell.js";
import { OperatorFeatureShell } from "./OperatorFeatureShell.js";
import { RecoveryFeatureShell } from "./RecoveryFeatureShell.js";
import { SessionFeatureShell } from "./SessionFeatureShell.js";

type SoftphoneReadyShellProps = Readonly<{
  facade: AccountBootstrapFacade;
  sessionLogoutActions: UseSessionLogoutActionsResult;
}>;

/**
 * - Purpose: compose all post-bootstrap feature shells and global overlays.
 * - Inputs: account bootstrap facade and shared session logout actions.
 * - Outputs: ready-state softphone UI tree.
 */
export function SoftphoneReadyShell({
  facade,
  sessionLogoutActions,
}: SoftphoneReadyShellProps): JSX.Element {
  const { projection, ocpNotificationProjection } = useSoftphoneProjections();
  const { showAccountPanel, blockingAuthState } = useAuthShellFlags();
  const phoneStatusActions = usePhoneStatusActions({ facade, disabled: blockingAuthState });

  const ocpNotifications = useOcpNotifications({
    isOcpMode: projection.isOcpMode,
    ocpNotificationProjection,
  });

  return (
    <>
      <OcpToastStack
        toasts={ocpNotifications.visibleToasts}
        onDismiss={ocpNotifications.dismissToast}
      />

      <RecoveryFeatureShell facade={facade} />

      <AuthStateView state={projection.authUiState} lastError={projection.lastError} />

      <SessionFeatureShell sessionLogoutActions={sessionLogoutActions} />

      <PhoneStatusBadge
        status={projection.phoneStatus}
        registrationLabel={registrationLabel(
          projection.registrationState,
          projection.authUiState,
        )}
        disabled={blockingAuthState}
        onChange={phoneStatusActions.handlePhoneStatusChange}
      />

      <OperatorFeatureShell facade={facade} />

      <AuthAccountShell
        facade={facade}
        visible={showAccountPanel && !blockingAuthState}
        disabled={false}
      />

      <CallFeatureShell facade={facade} />
    </>
  );
}

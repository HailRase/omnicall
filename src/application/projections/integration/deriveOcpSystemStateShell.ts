import type { OcpAuthorizationState } from "@domain/integration/ocp/OcpAuthorizationState.js";
import type { OcpServerState } from "@domain/integration/ocp/OcpServerState.js";
import type { OcpRecoveryAction } from "@domain/integration/ocp/ocpDualFsm.js";
import {
  resolveAllowedOcpRecoveryAction,
  selectPrimaryOcpRecoveryAction,
  type OcpDualFsmSnapshot,
} from "@domain/integration/ocp/ocpDualFsm.js";

export type OcpServerStateLabelKey =
  | "settings.systemState.ocp.server.disconnected"
  | "settings.systemState.ocp.server.connecting"
  | "settings.systemState.ocp.server.connected"
  | "settings.systemState.ocp.server.reconnecting"
  | "settings.systemState.ocp.server.failed";

export type OcpAuthorizationStateLabelKey =
  | "settings.systemState.ocp.authorization.idle"
  | "settings.systemState.ocp.authorization.pending"
  | "settings.systemState.ocp.authorization.authorized"
  | "settings.systemState.ocp.authorization.timeout"
  | "settings.systemState.ocp.authorization.rejected";

export type OcpRecoveryActionLabelKey =
  | "settings.systemState.ocp.action.retryServer"
  | "settings.systemState.ocp.action.retryAuthorization"
  | "settings.systemState.ocp.action.reconnect";

export type OcpSystemStateShellInput = Readonly<{
  dualFsm: OcpDualFsmSnapshot;
  /** When false, System State OCP tab is disabled (SIP-only). */
  ocpModuleEnabled: boolean;
}>;

export type OcpSystemStateShellView = Readonly<{
  ocpModuleEnabled: boolean;
  tabDisabledReasonKey: "settings.systemState.ocp.tab.disabled.moduleOff" | null;
  serverState: OcpServerState;
  authorizationState: OcpAuthorizationState;
  serverStateLabelKey: OcpServerStateLabelKey;
  authorizationStateLabelKey: OcpAuthorizationStateLabelKey;
  primaryRecoveryAction: OcpRecoveryAction | null;
  allowedRecoveryActions: ReadonlyArray<OcpRecoveryAction>;
  recoveryActionLabelKeys: Readonly<Record<OcpRecoveryAction, OcpRecoveryActionLabelKey>>;
}>;

const ALL_RECOVERY_ACTIONS: ReadonlyArray<OcpRecoveryAction> = [
  "retry_server",
  "retry_authorization",
  "reconnect",
];

const RECOVERY_ACTION_LABEL_KEYS: Readonly<
  Record<OcpRecoveryAction, OcpRecoveryActionLabelKey>
> = {
  retry_server: "settings.systemState.ocp.action.retryServer",
  retry_authorization: "settings.systemState.ocp.action.retryAuthorization",
  reconnect: "settings.systemState.ocp.action.reconnect",
};

/**
 * - Purpose: derive System State OCP tab view-model (ADR-AF-005), parallel to SIP shell.
 * - Inputs: dual FSM snapshot + OCP module enabled flag.
 * - Outputs: semantic label keys, recovery actions, tab disabled reason.
 */
export function deriveOcpSystemStateShell(
  input: OcpSystemStateShellInput,
): OcpSystemStateShellView {
  const allowedRecoveryActions = ALL_RECOVERY_ACTIONS.filter(
    (action) => resolveAllowedOcpRecoveryAction(input.dualFsm, action) !== null,
  );

  return {
    ocpModuleEnabled: input.ocpModuleEnabled,
    tabDisabledReasonKey: input.ocpModuleEnabled
      ? null
      : "settings.systemState.ocp.tab.disabled.moduleOff",
    serverState: input.dualFsm.serverState,
    authorizationState: input.dualFsm.authorizationState,
    serverStateLabelKey: deriveServerStateLabelKey(input.dualFsm.serverState),
    authorizationStateLabelKey: deriveAuthorizationStateLabelKey(
      input.dualFsm.authorizationState,
    ),
    primaryRecoveryAction: selectPrimaryOcpRecoveryAction(input.dualFsm),
    allowedRecoveryActions,
    recoveryActionLabelKeys: RECOVERY_ACTION_LABEL_KEYS,
  };
}

function deriveServerStateLabelKey(state: OcpServerState): OcpServerStateLabelKey {
  switch (state) {
    case "disconnected":
      return "settings.systemState.ocp.server.disconnected";
    case "connecting":
      return "settings.systemState.ocp.server.connecting";
    case "connected":
      return "settings.systemState.ocp.server.connected";
    case "reconnecting":
      return "settings.systemState.ocp.server.reconnecting";
    case "failed":
      return "settings.systemState.ocp.server.failed";
  }
}

function deriveAuthorizationStateLabelKey(
  state: OcpAuthorizationState,
): OcpAuthorizationStateLabelKey {
  switch (state.phase) {
    case "idle":
      return "settings.systemState.ocp.authorization.idle";
    case "pending":
      return "settings.systemState.ocp.authorization.pending";
    case "authorized":
      return "settings.systemState.ocp.authorization.authorized";
    case "timeout":
      return "settings.systemState.ocp.authorization.timeout";
    case "rejected":
      return "settings.systemState.ocp.authorization.rejected";
  }
}

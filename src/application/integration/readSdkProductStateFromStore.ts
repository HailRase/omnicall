/**
 * Build SdkProductStateSnapshot from the renderer bootstrap store (DI-05).
 */

import type { CallState } from "@domain/index.js";
import { OPERATOR_STATUS_LABEL_KEY } from "@domain/integration/ocp/OperatorStatus.js";

import type {
  SdkProductCallLine,
  SdkProductStateSnapshot,
} from "./ExternalSdkProductState.js";

export type SdkStoreProjectionSlice = Readonly<{
  projection: Readonly<{
    hasActiveAccountSession: boolean;
    sipUsername: string | null;
    registrationState: SdkProductStateSnapshot["registrationState"];
    lastError: string | null;
  }>;
  multiLineCallProjection: Readonly<{
    lines: ReadonlyArray<
      Readonly<{
        callId: string;
        state: CallState | "Idle";
        muted: boolean;
        remoteNumber: string | null;
        displayLabel: string | null;
      }>
    >;
  }>;
  incomingCallProjection: Readonly<{
    callId: string | null;
  }>;
  ocpSessionProjection: Readonly<{
    isAuthenticated: boolean;
    connectionState: string;
  }>;
  ocpOperatorStatusProjection: Readonly<{
    status: SdkProductStateSnapshot["operatorStatus"];
    reasonId: number;
    reservedStatus: SdkProductStateSnapshot["reservedStatus"];
    reservedReasonId: number | null;
  }>;
}>;

export type ReadSdkProductStateOptions = Readonly<{
  ocpModuleEnabled: boolean;
}>;

export function readSdkProductStateFromStore(
  store: SdkStoreProjectionSlice,
  options: ReadSdkProductStateOptions,
): SdkProductStateSnapshot {
  const signedIn = store.projection.hasActiveAccountSession;
  const profileLabel =
    store.projection.sipUsername !== null &&
    store.projection.sipUsername.length > 0
      ? store.projection.sipUsername
      : null;
  const calls = store.multiLineCallProjection.lines.map((line) =>
    toCallLine(line, store.incomingCallProjection.callId),
  );
  const ocpConnected =
    options.ocpModuleEnabled && store.ocpSessionProjection.isAuthenticated;
  const operatorStatus = store.ocpOperatorStatusProjection.status;
  return {
    signedIn,
    profileLabel,
    registrationState: store.projection.registrationState,
    registrationReasonCode: store.projection.lastError,
    calls,
    ocpEnabled: options.ocpModuleEnabled,
    ocpConnected,
    operatorStatus,
    operatorReasonId:
      operatorStatus !== null ? store.ocpOperatorStatusProjection.reasonId : null,
    operatorReasonLabelKey:
      operatorStatus !== null
        ? OPERATOR_STATUS_LABEL_KEY[operatorStatus]
        : null,
    reservedStatus: ocpConnected
      ? store.ocpOperatorStatusProjection.reservedStatus
      : null,
    reservedReasonId: ocpConnected
      ? store.ocpOperatorStatusProjection.reservedReasonId
      : null,
  };
}

function toCallLine(
  line: SdkStoreProjectionSlice["multiLineCallProjection"]["lines"][number],
  incomingCallId: string | null,
): SdkProductCallLine {
  const direction =
    incomingCallId !== null && incomingCallId === line.callId
      ? "inbound"
      : "outbound";
  return {
    callId: line.callId,
    state: line.state,
    direction,
    remoteNumber: line.remoteNumber,
    remoteDisplayName: line.displayLabel,
    muted: line.muted,
  };
}

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
  ocpCallContextProjection?: Readonly<{
    byCallId: Readonly<
      Record<
        string,
        Readonly<{
          queueName: string | null;
          resolveState: string;
          acdWire?: Readonly<{
            mainAcallId?: string;
            acallId: string;
            event: string;
            callerId: string;
            calledId: string;
            queue: string;
            userLogin: string;
            phase: "progress" | "accepted";
          }> | null;
        }>
      >
    >;
  }>;
  ocpCampaignEventProjection?: Readonly<{
    activeCampaign: SdkCampaignPayloadSlice | null;
    progressiveContext: SdkCampaignPayloadSlice | null;
    pendingPreview?: SdkCampaignPayloadSlice | null;
    phase?: string;
  }>;
}>;

type SdkCampaignPayloadSlice = Readonly<{
  id: string;
  progressive: boolean;
  clientPhone: string;
  companyTitle: string;
  strategyTitle: string;
  selectionTitle: string;
  queueTitle: string;
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
    toCallLine(
      line,
      store.incomingCallProjection.callId,
      store.ocpCallContextProjection?.byCallId[line.callId],
    ),
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
    activeCampaign: ocpConnected
      ? readActiveCampaignOffer(store.ocpCampaignEventProjection)
      : null,
  };
}

function readActiveCampaignOffer(
  projection:
    | SdkStoreProjectionSlice["ocpCampaignEventProjection"]
    | undefined,
): SdkProductStateSnapshot["activeCampaign"] {
  if (projection === undefined) {
    return null;
  }
  const source = projection.activeCampaign ?? projection.progressiveContext;
  if (source === null) {
    return null;
  }
  return {
    campaignId: source.id,
    progressive: source.progressive,
    clientPhone: source.clientPhone,
    companyTitle: source.companyTitle,
    strategyTitle: source.strategyTitle,
    selectionTitle: source.selectionTitle,
    queueTitle: source.queueTitle,
  };
}

function toCallLine(
  line: SdkStoreProjectionSlice["multiLineCallProjection"]["lines"][number],
  incomingCallId: string | null,
  callContext:
    | NonNullable<
        SdkStoreProjectionSlice["ocpCallContextProjection"]
      >["byCallId"][string]
    | undefined,
): SdkProductCallLine {
  const direction =
    incomingCallId !== null && incomingCallId === line.callId
      ? "inbound"
      : "outbound";
  const queueName = callContext?.queueName ?? null;
  const trimmedQueue =
    queueName !== null && queueName.trim().length > 0
      ? queueName.trim().slice(0, 128)
      : null;
  const wire = callContext?.acdWire ?? null;
  return {
    callId: line.callId,
    state: line.state,
    direction,
    remoteNumber: line.remoteNumber,
    remoteDisplayName: line.displayLabel,
    muted: line.muted,
    queueLabel: trimmedQueue,
    acdContext:
      wire !== null
        ? {
            ...(wire.mainAcallId !== undefined
              ? { mainAcallId: wire.mainAcallId }
              : {}),
            acallId: wire.acallId,
            event: wire.event,
            callerId: wire.callerId,
            calledId: wire.calledId,
            queue: wire.queue,
            userLogin: wire.userLogin,
            phase: wire.phase,
          }
        : null,
  };
}

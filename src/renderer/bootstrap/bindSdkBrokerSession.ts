/**
 * Bind DI-05…DI-08 SDK surface to the single Application composition.
 * Broker: ping + get-snapshot + call:* + operator/logout + activate-profile → Facade.
 * Events: Domain → public draft.
 */

import { RendererSdkBrokerSession } from "@adapters/integration/RendererSdkBrokerSession.js";
import { ExternalSdkAccountHandler } from "@application/integration/ExternalSdkAccountHandler.js";
import { ExternalSdkCallHandler } from "@application/integration/ExternalSdkCallHandler.js";
import { ExternalSdkOperatorHandler } from "@application/integration/ExternalSdkOperatorHandler.js";
import { ExternalSdkProductHandler } from "@application/integration/ExternalSdkProductHandler.js";
import { ExternalSdkReadHandler } from "@application/integration/ExternalSdkReadHandler.js";
import { createSdkAccountPortFromFacade } from "@application/integration/createSdkAccountPortFromFacade.js";
import { createSdkOperatorPortFromFacade } from "@application/integration/createSdkOperatorPortFromFacade.js";
import { mapDomainEventToSdkPublicDraft } from "@application/integration/ExternalSdkEventMapper.js";
import type { SdkOperatorEventMapContext } from "@application/integration/ExternalSdkEventMapper.js";
import type { SdkProductStateSnapshot } from "@application/integration/ExternalSdkProductState.js";
import {
  mapSdkOperatorStatus,
  mapSdkReservedOperatorTarget,
} from "@application/integration/mapSdkOperatorStatus.js";
import { readSdkProductStateFromStore } from "@application/integration/readSdkProductStateFromStore.js";
import { SdkAggregateMutex } from "@application/integration/SdkAggregateMutex.js";
import { SdkCallOwnershipRegistry } from "@application/integration/SdkCallOwnershipRegistry.js";
import {
  isSdkOperatorPublicEventType,
  SdkOperatorEventRevisionGate,
} from "@application/integration/SdkOperatorEventRevisionGate.js";
import { SdkSessionRevisionClock } from "@application/integration/SdkSessionRevisionClock.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { withMatrixCapability } from "@application/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { sdkActivateConsentBridge } from "./sdkActivateConsentBridge.js";
import { notifySdkIntegrationSettingsChanged } from "./sdkIntegrationSettingsSync.js";

const BROKER_SERVER_INSTANCE_ID = "srv_desktop_local";
const BROKER_SESSION_EPOCH_PREFIX = "epoch_desktop_";

const TERMINAL_CALL_EVENT_TYPES = new Set<string>([
  "CallEnded",
  "CallFailed",
  "IncomingCallEndedBeforeAnswer",
]);

export type BoundSdkBrokerSession = Readonly<{
  handler: ExternalSdkProductHandler;
  ownership: SdkCallOwnershipRegistry;
  dispose: () => void;
}>;

export type BindSdkBrokerSessionOptions = Readonly<{
  facade: AccountBootstrapFacade;
  /** When false/undefined, operator snapshot section is omitted (SIP-only safe). */
  ocpModuleEnabled?: boolean;
}>;

function buildSdkEventMapContext(
  state: SdkProductStateSnapshot,
): SdkOperatorEventMapContext {
  const queueLabelByCallId: Record<string, string> = {};
  for (const line of state.calls) {
    if (line.queueLabel !== null && line.queueLabel.length > 0) {
      queueLabelByCallId[line.callId] = line.queueLabel;
    }
  }
  const base: SdkOperatorEventMapContext = {
    queueLabelByCallId,
    callLines: state.calls,
  };
  if (!state.ocpConnected) {
    return base;
  }
  return {
    ...base,
    currentStatus: mapSdkOperatorStatus(state.operatorStatus),
    reservedTarget: mapSdkReservedOperatorTarget(state.reservedStatus),
    reservedReasonId: state.reservedReasonId,
  };
}

/**
 * - Purpose: attach typed broker + event bridge to one composition instance.
 * - Inputs: live facade after initialize + `window.softphone` preload API.
 */
export function bindSdkBrokerSession(
  options: BindSdkBrokerSessionOptions,
): BoundSdkBrokerSession {
  const revisionClock = new SdkSessionRevisionClock();
  const operatorEventRevisionGate = new SdkOperatorEventRevisionGate();
  const ownership = new SdkCallOwnershipRegistry();
  const accountMutex = new SdkAggregateMutex();
  const readHandler = new ExternalSdkReadHandler({
    readProductState: () =>
      readSdkProductStateFromStore(useAccountBootstrapStore.getState(), {
        ocpModuleEnabled: options.ocpModuleEnabled === true,
      }),
    revisionClock,
    ownership,
  });
  const callHandler = new ExternalSdkCallHandler({
    callPort: {
      makeCall: (destination) => options.facade.makeCall(destination),
      answerCall: (callId) => options.facade.answerCall(callId),
      rejectCall: (callId) => options.facade.rejectCall(callId),
      hangupCall: (callId) => options.facade.hangupCall(callId),
      holdCall: (callId) => options.facade.holdCall(callId),
      resumeCall: (callId) => options.facade.resumeCall(callId),
      muteCall: (callId) => options.facade.muteCall(callId),
      unmuteCall: (callId) => options.facade.unmuteCall(callId),
      sendDtmf: (callId, tone) => options.facade.sendDtmf(callId, tone),
    },
    ownership,
    revisionClock,
    mutex: accountMutex,
  });
  const operatorHandler = new ExternalSdkOperatorHandler({
    operatorPort: createSdkOperatorPortFromFacade({
      facade: options.facade,
      ...(options.ocpModuleEnabled !== undefined
        ? { ocpModuleEnabled: options.ocpModuleEnabled }
        : {}),
    }),
    revisionClock,
    mutex: accountMutex,
  });
  const accountHandler = new ExternalSdkAccountHandler({
    accountPort: createSdkAccountPortFromFacade({
      facade: options.facade,
      ...(options.ocpModuleEnabled !== undefined
        ? { ocpModuleEnabled: options.ocpModuleEnabled }
        : {}),
      getActivateSessionView: () => {
        const state = readSdkProductStateFromStore(
          useAccountBootstrapStore.getState(),
          {
            ocpModuleEnabled: options.ocpModuleEnabled === true,
          },
        );
        return {
          signedIn: state.signedIn,
          currentLogin: state.profileLabel,
          currentMode: state.signedIn
            ? state.ocpConnected
              ? ("ocp" as const)
              : ("sip_only" as const)
            : null,
          profileLabel: state.profileLabel,
        };
      },
    }),
    revisionClock,
    mutex: accountMutex,
    consentPort: sdkActivateConsentBridge,
    isConsentPending: () => sdkActivateConsentBridge.isPending(),
    onActivateConsentDenied: async (origin) => {
      const current = await options.facade.getUserSettingsForAccount();
      if (!current.ok) {
        return;
      }
      const entry = current.value.sdkIntegration.origins.find(
        (row) => row.origin === origin && row.state === "allowed",
      );
      if (entry?.matrix === null || entry === undefined) {
        return;
      }
      const nextMatrix = withMatrixCapability(
        entry.matrix,
        "account.activate",
        false,
      );
      const nextOrigins = current.value.sdkIntegration.origins.map((row) =>
        row.origin === origin ? { ...row, matrix: nextMatrix } : row,
      );
      await options.facade.saveUserSettings({
        ...current.value,
        sdkIntegration: {
          ...current.value.sdkIntegration,
          origins: nextOrigins,
          originsManaged: true,
        },
      });
      await window.softphone?.invokeSdkGatewaySettings({
        op: "setOriginMatrix",
        origin,
        matrix: nextMatrix,
      });
      notifySdkIntegrationSettingsChanged();
    },
  });
  const handler = new ExternalSdkProductHandler({
    readHandler,
    callHandler,
    operatorHandler,
    accountHandler,
  });
  const sessionEpoch = `${BROKER_SESSION_EPOCH_PREFIX}${Date.now().toString(36)}`;
  const session = new RendererSdkBrokerSession({
    handler,
    serverInstanceId: BROKER_SERVER_INSTANCE_ID,
    sessionEpoch,
  });

  const softphone = window.softphone;
  if (softphone === undefined) {
    return {
      handler,
      ownership,
      dispose: () => {
        ownership.clearAll();
      },
    };
  }

  session.markActive();
  const unsubscribeBroker = softphone.onSdkBrokerRequest((payload) => {
    void session.handleRequest(payload).then((reply) => {
      void softphone.replySdkBrokerRequest(reply);
    });
  });
  const unsubscribeClientEnded = softphone.onSdkClientSessionEnded((payload) => {
    handler.abortClientSession(payload.clientId);
  });

  const unsubscribeEvents = options.facade.eventPublisher.subscribe((event) => {
    if (TERMINAL_CALL_EVENT_TYPES.has(event.type)) {
      const callIdValue = event["callId"];
      if (typeof callIdValue === "string" && callIdValue.length > 0) {
        ownership.finalize(callIdValue);
      }
    }
    const productState = readSdkProductStateFromStore(
      useAccountBootstrapStore.getState(),
      {
        ocpModuleEnabled: options.ocpModuleEnabled === true,
      },
    );
    const draft = mapDomainEventToSdkPublicDraft(
      event,
      buildSdkEventMapContext(productState),
    );
    if (draft === null) {
      return;
    }
    const revision = isSdkOperatorPublicEventType(draft.type)
      ? operatorEventRevisionGate.preparePublish(draft, revisionClock).revision
      : handler.getRevision();
    void softphone.publishSdkGatewayEvent({
      draft: {
        type: draft.type,
        payload: draft.payload,
        revision,
      },
    });
  });

  const assertBrokerReady = (): void => {
    void softphone.setSdkBrokerReady({ ready: true });
  };
  // Claim ready now; re-assert after macrotask / pageshow / visibility so a
  // concurrent main-side clear (spurious load) cannot leave product path stuck
  // while this composition is still active (ADR-0009: ready must return).
  assertBrokerReady();
  const reassertTimer = window.setTimeout(assertBrokerReady, 0);
  const onPageShow = (): void => {
    assertBrokerReady();
  };
  const onVisibilityChange = (): void => {
    if (document.visibilityState === "visible") {
      assertBrokerReady();
    }
  };
  window.addEventListener("pageshow", onPageShow);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return {
    handler,
    ownership,
    dispose: () => {
      window.clearTimeout(reassertTimer);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      session.markInactive();
      unsubscribeBroker();
      unsubscribeClientEnded();
      unsubscribeEvents();
      ownership.clearAll();
      void softphone.setSdkBrokerReady({ ready: false });
    },
  };
}

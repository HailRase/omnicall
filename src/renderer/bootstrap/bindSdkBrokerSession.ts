/**
 * Bind DI-05…DI-07 SDK surface to the single Application composition.
 * Broker: ping + get-snapshot + call:* + operator/logout → Facade / Call Engine.
 * Events: Domain → public draft.
 */

import { RendererSdkBrokerSession } from "@adapters/integration/RendererSdkBrokerSession.js";
import { ExternalSdkCallHandler } from "@application/integration/ExternalSdkCallHandler.js";
import { ExternalSdkOperatorHandler } from "@application/integration/ExternalSdkOperatorHandler.js";
import { ExternalSdkProductHandler } from "@application/integration/ExternalSdkProductHandler.js";
import { ExternalSdkReadHandler } from "@application/integration/ExternalSdkReadHandler.js";
import { createSdkOperatorPortFromFacade } from "@application/integration/createSdkOperatorPortFromFacade.js";
import { mapDomainEventToSdkPublicDraft } from "@application/integration/ExternalSdkEventMapper.js";
import { readSdkProductStateFromStore } from "@application/integration/readSdkProductStateFromStore.js";
import { SdkCallOwnershipRegistry } from "@application/integration/SdkCallOwnershipRegistry.js";
import { SdkSessionRevisionClock } from "@application/integration/SdkSessionRevisionClock.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

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

/**
 * - Purpose: attach typed broker + event bridge to one composition instance.
 * - Inputs: live facade after initialize + `window.softphone` preload API.
 */
export function bindSdkBrokerSession(
  options: BindSdkBrokerSessionOptions,
): BoundSdkBrokerSession {
  const revisionClock = new SdkSessionRevisionClock();
  const ownership = new SdkCallOwnershipRegistry();
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
  });
  const operatorHandler = new ExternalSdkOperatorHandler({
    operatorPort: createSdkOperatorPortFromFacade({
      facade: options.facade,
      ...(options.ocpModuleEnabled !== undefined
        ? { ocpModuleEnabled: options.ocpModuleEnabled }
        : {}),
    }),
    revisionClock,
  });
  const handler = new ExternalSdkProductHandler({
    readHandler,
    callHandler,
    operatorHandler,
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
        operatorHandler.clearAllPendingLogouts();
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
    const draft = mapDomainEventToSdkPublicDraft(event);
    if (draft === null) {
      return;
    }
    void softphone.publishSdkGatewayEvent({
      draft: {
        type: draft.type,
        payload: draft.payload,
        revision: handler.getRevision(),
      },
    });
  });

  void softphone.setSdkBrokerReady({ ready: true });

  return {
    handler,
    ownership,
    dispose: () => {
      session.markInactive();
      unsubscribeBroker();
      unsubscribeClientEnded();
      unsubscribeEvents();
      operatorHandler.clearAllPendingLogouts();
      ownership.clearAll();
      void softphone.setSdkBrokerReady({ ready: false });
    },
  };
}

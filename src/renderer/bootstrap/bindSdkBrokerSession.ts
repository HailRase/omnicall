/**
 * Bind DI-05 read-only SDK surface to the single Application composition.
 * Broker: ping + get-snapshot. Events: Domain → public draft → main fan-out.
 */

import { RendererSdkBrokerSession } from "@adapters/integration/RendererSdkBrokerSession.js";
import { ExternalSdkReadHandler } from "@application/integration/ExternalSdkReadHandler.js";
import { mapDomainEventToSdkPublicDraft } from "@application/integration/ExternalSdkEventMapper.js";
import { readSdkProductStateFromStore } from "@application/integration/readSdkProductStateFromStore.js";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

const BROKER_SERVER_INSTANCE_ID = "srv_desktop_local";
const BROKER_SESSION_EPOCH_PREFIX = "epoch_desktop_";

export type BoundSdkBrokerSession = Readonly<{
  handler: ExternalSdkReadHandler;
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
  const handler = new ExternalSdkReadHandler({
    readProductState: () =>
      readSdkProductStateFromStore(useAccountBootstrapStore.getState(), {
        // Prefer omit operator until settings prove OCP module on (ADR-0012).
        ocpModuleEnabled: options.ocpModuleEnabled === true,
      }),
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
      dispose: () => undefined,
    };
  }

  session.markActive();
  const unsubscribeBroker = softphone.onSdkBrokerRequest((payload) => {
    void session.handleRequest(payload).then((reply) => {
      void softphone.replySdkBrokerRequest(reply);
    });
  });

  const unsubscribeEvents = options.facade.eventPublisher.subscribe((event) => {
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
    dispose: () => {
      session.markInactive();
      unsubscribeBroker();
      unsubscribeEvents();
      void softphone.setSdkBrokerReady({ ready: false });
    },
  };
}

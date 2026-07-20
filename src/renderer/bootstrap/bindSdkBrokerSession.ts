/**
 * Bind the DI-02 renderer broker session to the single Application composition.
 * Not a second Facade — only readiness + sdk:ping delivery probe.
 */

import { RendererSdkBrokerSession } from "@adapters/integration/RendererSdkBrokerSession.js";
import { SdkBrokerProbeHandler } from "@application/integration/SdkBrokerProbeHandler.js";

const BROKER_SERVER_INSTANCE_ID = "srv_desktop_local";
const BROKER_SESSION_EPOCH_PREFIX = "epoch_desktop_";

export type BoundSdkBrokerSession = Readonly<{
  handler: SdkBrokerProbeHandler;
  dispose: () => void;
}>;

/**
 * - Purpose: attach typed broker receive/reply/ready to one composition instance.
 * - Inputs: live `window.softphone` preload API after facade initialize.
 * - Outputs: probe handler (for tests/diagnostics) and dispose that clears ready.
 */
export function bindSdkBrokerSession(): BoundSdkBrokerSession {
  const handler = new SdkBrokerProbeHandler();
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
  const unsubscribe = softphone.onSdkBrokerRequest((payload) => {
    void session.handleRequest(payload).then((reply) => {
      void softphone.replySdkBrokerRequest(reply);
    });
  });

  void softphone.setSdkBrokerReady({ ready: true });

  return {
    handler,
    dispose: () => {
      session.markInactive();
      unsubscribe();
      void softphone.setSdkBrokerReady({ ready: false });
    },
  };
}

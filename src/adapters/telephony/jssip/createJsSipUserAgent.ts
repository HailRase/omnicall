import JsSIP from "@hailrase/jssip";

import type { SipAccount } from "@domain/index.js";

import type { JsSipUaPort } from "./JsSipUaPort.js";
import { wrapJsSipRtcSession } from "./wrapJsSipRtcSession.js";

import { resolveJsSipTransportUrl } from "./resolveJsSipTransportUrl.js";

/**
 * - Purpose: build JsSIP UA configuration and instance from domain SipAccount.
 * - Inputs: SipAccount with server WebSocket URL, domain, and SIP credentials.
 * - Outputs: JsSIP UA port ready for start/register (register=false in config).
 * - Reconnect: connection_recovery_* is transport-level only; app orchestration owns retry policy.
 */
export function buildJsSipUaConfiguration(account: SipAccount): {
  sockets: [InstanceType<typeof JsSIP.WebSocketInterface>];
  uri: string;
  password: string;
  authorization_user: string;
  register: false;
  connection_recovery_min_interval: number;
  connection_recovery_max_interval: number;
} {
  const transportUrl = resolveJsSipTransportUrl(account.server);
  const socket = new JsSIP.WebSocketInterface(transportUrl);

  return {
    sockets: [socket],
    uri: account.uri,
    password: account.password,
    authorization_user: account.username,
    register: false,
    connection_recovery_min_interval: 300,
    connection_recovery_max_interval: 300,
  };
}

export function createJsSipUserAgent(account: SipAccount): JsSipUaPort {
  const ua = new JsSIP.UA(buildJsSipUaConfiguration(account));

  return {
    on: (event, listener) => {
      ua.on(event, listener);
    },
    off: (event, listener) => {
      ua.off(event, listener);
    },
    start: () => {
      ua.start();
    },
    stop: () => {
      ua.stop();
    },
    register: () => {
      ua.register();
    },
    unregister: (options) => {
      ua.unregister(options);
    },
    isRegistered: () => ua.isRegistered(),
    isConnected: () => ua.isConnected(),
    call: (target, options) => {
      const session = ua.call(target, options);
      return wrapJsSipRtcSession(session);
    },
  };
}

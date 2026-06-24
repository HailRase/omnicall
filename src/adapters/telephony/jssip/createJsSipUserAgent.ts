import JsSIP from "jssip";

import type { SipAccount } from "@domain/index.js";

import type { JsSipUaPort } from "./JsSipUaPort.js";
import { wrapJsSipRtcSession } from "./wrapJsSipRtcSession.js";

import { resolveJsSipTransportUrl } from "./resolveJsSipTransportUrl.js";



/**

 * - Purpose: build JsSIP UA configuration and instance from domain SipAccount.

 * - Inputs: SipAccount with registrar WebSocket URL and SIP credentials.

 * - Outputs: JsSIP UA port ready for start/register (register=false in config).

 */

export function buildJsSipUaConfiguration(account: SipAccount): {

  sockets: [InstanceType<typeof JsSIP.WebSocketInterface>];

  uri: string;

  password: string;

  authorization_user: string;

  display_name: string;

  register: false;

  connection_recovery_min_interval: number;

  connection_recovery_max_interval: number;

} {

  const transportUrl = resolveJsSipTransportUrl(account.registrar);

  const socket = new JsSIP.WebSocketInterface(transportUrl);

  const uri = resolveSipUri(account);



  return {

    sockets: [socket],

    uri,

    password: account.password,

    authorization_user: account.username,

    display_name: account.displayName,

    register: false,

    connection_recovery_min_interval: 2,

    connection_recovery_max_interval: 30,

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



function resolveSipUri(account: SipAccount): string {

  if (account.uri.trim().length > 0) {

    return account.uri.trim();

  }



  const host = extractSipDomainHost(account.registrar);

  return `sip:${account.username}@${host}`;

}



function extractSipDomainHost(registrar: string): string {

  const trimmed = registrar.trim();

  if (trimmed.length === 0) {

    return "localhost";

  }



  try {

    const url = new URL(

      trimmed.startsWith("ws") || trimmed.startsWith("http")

        ? trimmed

        : `wss://${trimmed}`,

    );

    return url.hostname;

  } catch {

    return trimmed.replace(/^wss?:\/\//u, "").split("/")[0]?.split(":")[0] ?? "localhost";

  }

}



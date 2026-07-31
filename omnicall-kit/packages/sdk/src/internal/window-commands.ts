/**
 * Capability-gated window command runner (SDK-05 + window.hide).
 */

import type { CapabilityId } from '@softomnitel/omnicall-protocol';

import type { ConnectionSession } from './connection-session.js';
import {
  guardCapability,
  guardReady,
  mapReplyFailure,
  readWindowState,
  requireWireIdentity
} from './product-commands.js';
import {
  buildWindowGetStateBody,
  buildWindowHideBody,
  buildWindowShowBody
} from './product-wire.js';
import type { Scheduler } from './scheduler.js';

export type WindowStateResult = {
  readonly visible: boolean;
  readonly revision: number;
};

export type WindowCommandApi = {
  readonly showWindow: () => Promise<WindowStateResult>;
  readonly hideWindow: (input: {
    readonly expectedRevision: number;
  }) => Promise<WindowStateResult>;
  readonly getWindowState: () => Promise<WindowStateResult>;
};

export function createWindowCommandApi(deps: {
  readonly connection: ConnectionSession;
  readonly scheduler: Scheduler;
  readonly getGrantedCapabilities: () => readonly CapabilityId[];
}): WindowCommandApi {
  const runShowOrGetState = async (
    commandType: 'window:show' | 'window:get-state'
  ): Promise<WindowStateResult> => {
    const notReady = guardReady(deps.connection);
    if (notReady !== undefined) {
      return Promise.reject(notReady);
    }
    const missingCap = guardCapability(
      deps.getGrantedCapabilities(),
      'window.show'
    );
    if (missingCap !== undefined) {
      return Promise.reject(missingCap);
    }
    const identity = requireWireIdentity(deps.connection);
    if ('code' in identity) {
      return Promise.reject(identity);
    }
    const requestId = crypto.randomUUID();
    const fields = {
      requestId,
      serverInstanceId: identity.serverInstanceId,
      sessionEpoch: identity.sessionEpoch,
      occurredAtMs: deps.scheduler.now()
    };
    const body =
      commandType === 'window:show'
        ? buildWindowShowBody(fields)
        : buildWindowGetStateBody(fields);
    const result = await deps.connection.request({
      requestId,
      commandType,
      body
    });
    if (!result.ok || !result.reply.ok) {
      return Promise.reject(mapReplyFailure(result));
    }
    return readWindowState(result.reply);
  };

  const hideWindow = async (input: {
    readonly expectedRevision: number;
  }): Promise<WindowStateResult> => {
    const notReady = guardReady(deps.connection);
    if (notReady !== undefined) {
      return Promise.reject(notReady);
    }
    const missingCap = guardCapability(
      deps.getGrantedCapabilities(),
      'window.hide'
    );
    if (missingCap !== undefined) {
      return Promise.reject(missingCap);
    }
    const identity = requireWireIdentity(deps.connection);
    if ('code' in identity) {
      return Promise.reject(identity);
    }
    const requestId = crypto.randomUUID();
    const result = await deps.connection.request({
      requestId,
      commandType: 'window:hide',
      body: buildWindowHideBody({
        requestId,
        serverInstanceId: identity.serverInstanceId,
        sessionEpoch: identity.sessionEpoch,
        occurredAtMs: deps.scheduler.now(),
        expectedRevision: input.expectedRevision
      })
    });
    if (!result.ok || !result.reply.ok) {
      return Promise.reject(mapReplyFailure(result));
    }
    return readWindowState(result.reply);
  };

  return {
    showWindow: () => runShowOrGetState('window:show'),
    hideWindow,
    getWindowState: () => runShowOrGetState('window:get-state')
  };
}

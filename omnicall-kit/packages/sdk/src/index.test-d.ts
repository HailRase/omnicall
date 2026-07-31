import { describe, expectTypeOf, it } from 'vitest';

import type {
  ActivateProfileMode,
  ActivateProfileResult,
  AuthClient,
  OmniCallClient,
  OmniCallClientOptions,
  OmniCallEventOf,
  ConnectionState,
  OperatorStatusChangeKind,
  OperatorStatusChangeResult,
  PopKeyStore,
  PublicEventType,
  PublicOperatorStatus,
  SnapshotMessage,
  TransportPort
} from './index.js';
import {
  createAuthClient,
  createOmniCallClient,
  createBrowserJitterSource,
  createBrowserScheduler,
  createBrowserWebSocketTransport,
  isInteractionRequiredError,
  readInteractionRequiredDetails
} from './index.js';

describe('@softomnitel/omnicall-kit type smoke', () => {
  it('keeps AuthClient without product methods', () => {
    expectTypeOf(createAuthClient).toBeFunction();
    expectTypeOf<AuthClient>().toHaveProperty('getGrantedCapabilities');
    expectTypeOf<AuthClient>().not.toHaveProperty('getSnapshot');
    expectTypeOf<AuthClient>().not.toHaveProperty('window');
  });

  it('exposes OmniCallClient with namespaced calls (no root mutations)', () => {
    expectTypeOf(createOmniCallClient).toBeFunction();
    expectTypeOf<OmniCallClient>().toHaveProperty('getSnapshot');
    expectTypeOf<OmniCallClient>().toHaveProperty('subscribe');
    expectTypeOf<OmniCallClient>().toHaveProperty('window');
    expectTypeOf<OmniCallClient>().toHaveProperty('calls');
    expectTypeOf<OmniCallClient>().not.toHaveProperty('originate');
    expectTypeOf<OmniCallClient>().not.toHaveProperty('hide');
    expectTypeOf<OmniCallClient['calls']>().toHaveProperty('originate');
    expectTypeOf<OmniCallClient['calls']>().toHaveProperty('sendDtmf');
    expectTypeOf<OmniCallClient['window']>().toHaveProperty('hide');
    expectTypeOf<OmniCallClient['window']>().toHaveProperty('show');
    expectTypeOf<OmniCallClientOptions>().toHaveProperty('origin');
    expectTypeOf<OmniCallClientOptions['transportFactory']>().toEqualTypeOf<
      (() => TransportPort) | undefined
    >();
    expectTypeOf(createBrowserWebSocketTransport).toBeFunction();
    expectTypeOf(createBrowserScheduler).toBeFunction();
    expectTypeOf(createBrowserJitterSource).toBeFunction();
    expectTypeOf<PopKeyStore>().toHaveProperty('clear');
    expectTypeOf<'call:incoming'>().toExtend<PublicEventType>();
    expectTypeOf<'ready'>().toExtend<ConnectionState>();
  });

  it('exposes namespaced operator and account activate/logout (no root / no secrets)', () => {
    expectTypeOf<OmniCallClient>().toHaveProperty('operator');
    expectTypeOf<OmniCallClient>().toHaveProperty('account');
    expectTypeOf<OmniCallClient>().not.toHaveProperty('logout');
    expectTypeOf<OmniCallClient>().not.toHaveProperty('changeStatus');
    expectTypeOf<OmniCallClient>().not.toHaveProperty('getReasons');
    expectTypeOf<OmniCallClient>().not.toHaveProperty('activateProfile');
    expectTypeOf<OmniCallClient['operator']>().toHaveProperty('getReasons');
    expectTypeOf<OmniCallClient['operator']>().toHaveProperty('changeStatus');
    expectTypeOf<OmniCallClient['operator']>().toHaveProperty('finishAppeal');
    expectTypeOf<OmniCallClient['account']>().toHaveProperty('logout');
    expectTypeOf<OmniCallClient['account']>().not.toHaveProperty('prepareLogout');
    expectTypeOf<OmniCallClient['account']>().not.toHaveProperty('confirmLogout');
    expectTypeOf<OmniCallClient['account']>().toHaveProperty('activateProfile');
    expectTypeOf<
      Parameters<OmniCallClient['account']['logout']>[0]
    >().toHaveProperty('expectedRevision');
    expectTypeOf<
      Parameters<OmniCallClient['account']['logout']>[0]
    >().toHaveProperty('reasonId');
    expectTypeOf<
      Parameters<OmniCallClient['account']['logout']>[0]
    >().not.toHaveProperty('logoutToken');
    expectTypeOf<
      Parameters<OmniCallClient['account']['activateProfile']>[0]
    >().toHaveProperty('login');
    expectTypeOf<
      Parameters<OmniCallClient['account']['activateProfile']>[0]
    >().toHaveProperty('expectedRevision');
    expectTypeOf<
      Parameters<OmniCallClient['account']['activateProfile']>[0]
    >().toHaveProperty('mode');
    expectTypeOf<
      Parameters<OmniCallClient['account']['activateProfile']>[0]
    >().not.toHaveProperty('password');
    expectTypeOf<
      Parameters<OmniCallClient['account']['activateProfile']>[0]
    >().not.toHaveProperty('apiKey');
    expectTypeOf<'operator:status-changed'>().toExtend<PublicEventType>();
    expectTypeOf<'account:session-activated'>().toExtend<PublicEventType>();
    expectTypeOf<'account:session-ended'>().toExtend<PublicEventType>();
    expectTypeOf<OperatorStatusChangeResult['kind']>().toEqualTypeOf<OperatorStatusChangeKind>();
    expectTypeOf<'applied'>().toExtend<OperatorStatusChangeKind>();
    expectTypeOf<'reserved'>().toExtend<OperatorStatusChangeKind>();
    expectTypeOf<OperatorStatusChangeResult['accepted']>().toEqualTypeOf<true>();
    expectTypeOf<OperatorStatusChangeResult['targetStatus']>().toEqualTypeOf<PublicOperatorStatus>();
  });

  it('re-exports protocol DTOs and event/error helpers for integrators', () => {
    expectTypeOf<SnapshotMessage['kind']>().toEqualTypeOf<'snapshot'>();
    expectTypeOf<OmniCallEventOf<'call:incoming'>['type']>().toEqualTypeOf<'call:incoming'>();
    expectTypeOf<ActivateProfileResult['mode']>().toEqualTypeOf<ActivateProfileMode>();
    expectTypeOf<'sip_only'>().toExtend<ActivateProfileMode>();
    expectTypeOf(readInteractionRequiredDetails).toBeFunction();
    expectTypeOf(isInteractionRequiredError).toBeFunction();
    type IncomingPayload = OmniCallEventOf<'call:incoming'>['payload'];
    expectTypeOf<IncomingPayload>().toHaveProperty('callId');
  });
});

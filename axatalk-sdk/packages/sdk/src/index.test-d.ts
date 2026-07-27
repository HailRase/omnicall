import { describe, expectTypeOf, it } from 'vitest';

import type {
  ActivateProfileMode,
  ActivateProfileResult,
  AuthClient,
  AxatalkClient,
  AxatalkClientOptions,
  AxatalkEventOf,
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
  createAxatalkClient,
  createBrowserJitterSource,
  createBrowserScheduler,
  createBrowserWebSocketTransport,
  isInteractionRequiredError,
  readInteractionRequiredDetails
} from './index.js';

describe('@axata/axatalk-sdk type smoke', () => {
  it('keeps AuthClient without product methods', () => {
    expectTypeOf(createAuthClient).toBeFunction();
    expectTypeOf<AuthClient>().toHaveProperty('getGrantedCapabilities');
    expectTypeOf<AuthClient>().not.toHaveProperty('getSnapshot');
    expectTypeOf<AuthClient>().not.toHaveProperty('window');
  });

  it('exposes AxatalkClient with namespaced calls (no root mutations)', () => {
    expectTypeOf(createAxatalkClient).toBeFunction();
    expectTypeOf<AxatalkClient>().toHaveProperty('getSnapshot');
    expectTypeOf<AxatalkClient>().toHaveProperty('subscribe');
    expectTypeOf<AxatalkClient>().toHaveProperty('window');
    expectTypeOf<AxatalkClient>().toHaveProperty('calls');
    expectTypeOf<AxatalkClient>().not.toHaveProperty('originate');
    expectTypeOf<AxatalkClient>().not.toHaveProperty('hide');
    expectTypeOf<AxatalkClient['calls']>().toHaveProperty('originate');
    expectTypeOf<AxatalkClient['calls']>().toHaveProperty('sendDtmf');
    expectTypeOf<AxatalkClient['window']>().toHaveProperty('hide');
    expectTypeOf<AxatalkClient['window']>().toHaveProperty('show');
    expectTypeOf<AxatalkClientOptions>().toHaveProperty('origin');
    expectTypeOf<AxatalkClientOptions['transportFactory']>().toEqualTypeOf<
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
    expectTypeOf<AxatalkClient>().toHaveProperty('operator');
    expectTypeOf<AxatalkClient>().toHaveProperty('account');
    expectTypeOf<AxatalkClient>().not.toHaveProperty('logout');
    expectTypeOf<AxatalkClient>().not.toHaveProperty('changeStatus');
    expectTypeOf<AxatalkClient>().not.toHaveProperty('getReasons');
    expectTypeOf<AxatalkClient>().not.toHaveProperty('activateProfile');
    expectTypeOf<AxatalkClient['operator']>().toHaveProperty('getReasons');
    expectTypeOf<AxatalkClient['operator']>().toHaveProperty('changeStatus');
    expectTypeOf<AxatalkClient['operator']>().toHaveProperty('finishAppeal');
    expectTypeOf<AxatalkClient['account']>().toHaveProperty('logout');
    expectTypeOf<AxatalkClient['account']>().not.toHaveProperty('prepareLogout');
    expectTypeOf<AxatalkClient['account']>().not.toHaveProperty('confirmLogout');
    expectTypeOf<AxatalkClient['account']>().toHaveProperty('activateProfile');
    expectTypeOf<
      Parameters<AxatalkClient['account']['logout']>[0]
    >().toHaveProperty('expectedRevision');
    expectTypeOf<
      Parameters<AxatalkClient['account']['logout']>[0]
    >().toHaveProperty('reasonId');
    expectTypeOf<
      Parameters<AxatalkClient['account']['logout']>[0]
    >().not.toHaveProperty('logoutToken');
    expectTypeOf<
      Parameters<AxatalkClient['account']['activateProfile']>[0]
    >().toHaveProperty('login');
    expectTypeOf<
      Parameters<AxatalkClient['account']['activateProfile']>[0]
    >().toHaveProperty('expectedRevision');
    expectTypeOf<
      Parameters<AxatalkClient['account']['activateProfile']>[0]
    >().toHaveProperty('mode');
    expectTypeOf<
      Parameters<AxatalkClient['account']['activateProfile']>[0]
    >().not.toHaveProperty('password');
    expectTypeOf<
      Parameters<AxatalkClient['account']['activateProfile']>[0]
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
    expectTypeOf<AxatalkEventOf<'call:incoming'>['type']>().toEqualTypeOf<'call:incoming'>();
    expectTypeOf<ActivateProfileResult['mode']>().toEqualTypeOf<ActivateProfileMode>();
    expectTypeOf<'sip_only'>().toExtend<ActivateProfileMode>();
    expectTypeOf(readInteractionRequiredDetails).toBeFunction();
    expectTypeOf(isInteractionRequiredError).toBeFunction();
    type IncomingPayload = AxatalkEventOf<'call:incoming'>['payload'];
    expectTypeOf<IncomingPayload>().toHaveProperty('callId');
  });
});

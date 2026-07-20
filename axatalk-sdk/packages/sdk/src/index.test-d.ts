import { describe, expectTypeOf, it } from 'vitest';

import type {
  AuthClient,
  AxatalkClient,
  AxatalkClientOptions,
  ConnectionState,
  PopKeyStore,
  PublicEventType
} from './index.js';
import { createAuthClient, createAxatalkClient } from './index.js';

describe('@axatalk/sdk type smoke', () => {
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
    expectTypeOf<AxatalkClient['window']>().not.toHaveProperty('hide');
    expectTypeOf<AxatalkClientOptions>().toHaveProperty('origin');
    expectTypeOf<PopKeyStore>().toHaveProperty('clear');
    expectTypeOf<'call:incoming'>().toExtend<PublicEventType>();
    expectTypeOf<'ready'>().toExtend<ConnectionState>();
  });

  it('exposes namespaced operator and account activate/logout (no root / no secrets)', () => {
    expectTypeOf<AxatalkClient>().toHaveProperty('operator');
    expectTypeOf<AxatalkClient>().toHaveProperty('account');
    expectTypeOf<AxatalkClient>().not.toHaveProperty('prepareLogout');
    expectTypeOf<AxatalkClient>().not.toHaveProperty('confirmLogout');
    expectTypeOf<AxatalkClient>().not.toHaveProperty('changeStatus');
    expectTypeOf<AxatalkClient>().not.toHaveProperty('getReasons');
    expectTypeOf<AxatalkClient>().not.toHaveProperty('activateProfile');
    expectTypeOf<AxatalkClient['operator']>().toHaveProperty('getReasons');
    expectTypeOf<AxatalkClient['operator']>().toHaveProperty('changeStatus');
    expectTypeOf<AxatalkClient['account']>().toHaveProperty('prepareLogout');
    expectTypeOf<AxatalkClient['account']>().toHaveProperty('confirmLogout');
    expectTypeOf<AxatalkClient['account']>().toHaveProperty('activateProfile');
    expectTypeOf<
      Parameters<AxatalkClient['account']['activateProfile']>[0]
    >().toHaveProperty('profileRef');
    expectTypeOf<
      Parameters<AxatalkClient['account']['activateProfile']>[0]
    >().toHaveProperty('expectedRevision');
    expectTypeOf<
      Parameters<AxatalkClient['account']['activateProfile']>[0]
    >().not.toHaveProperty('password');
    expectTypeOf<
      Parameters<AxatalkClient['account']['activateProfile']>[0]
    >().not.toHaveProperty('apiKey');
    expectTypeOf<'operator:status-changed'>().toExtend<PublicEventType>();
    expectTypeOf<'account:session-activated'>().toExtend<PublicEventType>();
    expectTypeOf<'account:session-ended'>().toExtend<PublicEventType>();
  });
});

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
});

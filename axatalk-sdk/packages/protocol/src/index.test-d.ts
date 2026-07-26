import { describe, expectTypeOf, it } from 'vitest';

import type {
  CAPABILITY_IDS,
  CapabilityId,
  CommandMessage,
  CommandSuccessReply,
  DiscoveryDocument,
  EventMessage,
  PROTOCOL_ERROR_CODES,
  ProtocolErrorCode,
  V1_DEFERRED_CAMPAIGN_EVENTS,
  WireJsonValue,
  WireMessage
} from './index.js';

describe('@axata/axatalk-protocol type surface', () => {
  it('infers readonly discovery and wire message types', () => {
    expectTypeOf<DiscoveryDocument>().toMatchTypeOf<{
      readonly discoveryVersion: 1;
      readonly wsUrl: string;
    }>();
    expectTypeOf<WireMessage>().not.toBeNever();
    expectTypeOf<CommandMessage['kind']>().toEqualTypeOf<'command'>();
    expectTypeOf<EventMessage['kind']>().toEqualTypeOf<'event'>();
    expectTypeOf<CommandSuccessReply['result']>().toExtend<
      Readonly<Record<string, WireJsonValue>>
    >();
  });

  it('keeps capability and error code unions stable', () => {
    expectTypeOf<CapabilityId>().toExtend<(typeof CAPABILITY_IDS)[number]>();
    expectTypeOf<ProtocolErrorCode>().toExtend<
      (typeof PROTOCOL_ERROR_CODES)[number]
    >();
    type PermissionChanged = Extract<
      EventMessage,
      { type: 'sdk:permission-changed' }
    >;
    expectTypeOf<
      PermissionChanged['payload']['grantedCapabilities'][number]
    >().toExtend<CapabilityId>();
  });

  it('includes campaign events in EventMessage (ADR-0019)', () => {
    type EventType = EventMessage['type'];
    expectTypeOf<'operator:campaign-offered'>().toExtend<EventType>();
    expectTypeOf<'operator:campaign-cleared'>().toExtend<EventType>();
    expectTypeOf<(typeof V1_DEFERRED_CAMPAIGN_EVENTS)[number]>().toBeNever();
  });
});

import { describe, expect, it } from 'vitest';

import { discoverOmniCallDesktop } from './discovery.js';

const discovery = {
  discoveryVersion: 1,
  protocolMin: 1,
  protocolMax: 1,
  desktopVersion: '1.3.0',
  serverInstanceId: 'srv_discovery_test',
  wsUrl: 'ws://127.0.0.1:17341/omnicall/v1/ws',
  maxMessageBytes: 65_536,
  heartbeatSeconds: 30,
  pairingRequired: true
};

describe('discoverOmniCallDesktop', () => {
  it('uses the fixed loopback endpoint and validates the document', async () => {
    const fetch = (input: string): Promise<Response> => {
      expect(input).toBe('http://127.0.0.1:17341/omnicall/v1/discovery');
      return Promise.resolve(new Response(JSON.stringify(discovery), { status: 200 }));
    };

    await expect(discoverOmniCallDesktop({ fetch })).resolves.toEqual(discovery);
  });

  it('rejects redirects and malformed discovery data', async () => {
    const redirect = (): Promise<Response> =>
      Promise.resolve({ ok: true, redirected: true } as Response);
    const malformed = (): Promise<Response> =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));

    await expect(discoverOmniCallDesktop({ fetch: redirect })).rejects.toMatchObject({
      code: 'discovery_unreachable'
    });
    await expect(discoverOmniCallDesktop({ fetch: malformed })).rejects.toMatchObject({
      code: 'invalid_payload'
    });
  });
});

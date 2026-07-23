/**
 * Unit tests for the official browser WebSocket transport adapter.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  createBrowserWebSocketTransport,
  type BrowserWebSocketConstructor,
  type BrowserWebSocketLike
} from './browser-websocket-transport.js';

type MockSocket = BrowserWebSocketLike & {
  readonly url: string;
  readyState: number;
  triggerOpen: () => void;
  triggerMessage: (data: unknown) => void;
  triggerError: () => void;
  triggerClose: (code?: number, reason?: string) => void;
};

function createMockWebSocketConstructor(): {
  readonly ctor: BrowserWebSocketConstructor;
  readonly instances: MockSocket[];
} {
  const instances: MockSocket[] = [];

  class MockWebSocket implements BrowserWebSocketLike {
    static readonly OPEN = 1;
    readyState = 0;
    binaryType = 'blob';
    onopen: ((ev: Event) => void) | null = null;
    onmessage: ((ev: MessageEvent) => void) | null = null;
    onerror: ((ev: Event) => void) | null = null;
    onclose: ((ev: CloseEvent) => void) | null = null;
    readonly url: string;
    readonly send = vi.fn((data: string) => {
      void data;
    });
    readonly close = vi.fn((code?: number, reason?: string) => {
      this.readyState = 3;
      this.onclose?.(
        {
          code: code ?? 1000,
          reason: reason ?? ''
        } as CloseEvent
      );
    });

    constructor(url: string) {
      this.url = url;
      const self = this as unknown as MockSocket;
      Object.assign(self, {
        triggerOpen: () => {
          this.readyState = MockWebSocket.OPEN;
          this.onopen?.(new Event('open'));
        },
        triggerMessage: (data: unknown) => {
          this.onmessage?.({ data } as MessageEvent);
        },
        triggerError: () => {
          this.onerror?.(new Event('error'));
        },
        triggerClose: (code = 1006, reason = 'abnormal') => {
          this.readyState = 3;
          this.onclose?.({ code, reason } as CloseEvent);
        }
      });
      instances.push(self);
    }
  }

  return {
    ctor: MockWebSocket,
    instances
  };
}

describe('createBrowserWebSocketTransport', () => {
  it('opens, sends text, and closes with mapped close info', () => {
    const { ctor, instances } = createMockWebSocketConstructor();
    const transport = createBrowserWebSocketTransport({ webSocket: ctor });
    const opens: number[] = [];
    const closes: { code: number; reason: string }[] = [];
    const messages: string[] = [];

    transport.onOpen(() => {
      opens.push(1);
    });
    transport.onClose((info) => {
      closes.push({ code: info.code, reason: info.reason });
    });
    transport.onMessage((data) => {
      messages.push(data);
    });

    transport.connect('ws://127.0.0.1:17341/axatalk/v1/ws');
    expect(instances).toHaveLength(1);
    expect(instances[0]?.url).toBe('ws://127.0.0.1:17341/axatalk/v1/ws');

    instances[0]?.triggerOpen();
    expect(opens).toEqual([1]);

    transport.send('{"type":"sdk:ping"}');
    expect(instances[0]?.send).toHaveBeenCalledWith('{"type":"sdk:ping"}');

    instances[0]?.triggerMessage('{"type":"sdk:pong"}');
    expect(messages).toEqual(['{"type":"sdk:pong"}']);

    transport.close(1000, 'done');
    expect(closes).toEqual([{ code: 1000, reason: 'done' }]);
  });

  it('rejects binary frames and closes with unsupported_data', () => {
    const { ctor, instances } = createMockWebSocketConstructor();
    const transport = createBrowserWebSocketTransport({ webSocket: ctor });
    const errors: string[] = [];
    const closes: string[] = [];

    transport.onError((info) => {
      errors.push(info.message);
    });
    transport.onClose((info) => {
      closes.push(info.reason);
    });

    transport.connect('ws://127.0.0.1/ws');
    instances[0]?.triggerOpen();
    instances[0]?.triggerMessage(new ArrayBuffer(4));

    expect(errors).toEqual(['unsupported_data']);
    expect(instances[0]?.close).toHaveBeenCalledWith(1003, 'unsupported_data');
    expect(closes).toEqual(['unsupported_data']);
  });

  it('fails closed when reused and when WebSocket is missing', () => {
    const { ctor } = createMockWebSocketConstructor();
    const transport = createBrowserWebSocketTransport({ webSocket: ctor });
    transport.connect('ws://127.0.0.1/ws');
    expect(() => transport.connect('ws://127.0.0.1/ws')).toThrow(
      /already used/
    );

    const original = (globalThis as { WebSocket?: unknown }).WebSocket;
    try {
      delete (globalThis as { WebSocket?: unknown }).WebSocket;
      const missing = createBrowserWebSocketTransport();
      expect(() => missing.connect('ws://127.0.0.1/ws')).toThrow(/unavailable/);
    } finally {
      (globalThis as { WebSocket?: unknown }).WebSocket = original;
    }
  });

  it('unsubscribe prevents further open callbacks', () => {
    const { ctor, instances } = createMockWebSocketConstructor();
    const transport = createBrowserWebSocketTransport({ webSocket: ctor });
    let count = 0;
    const off = transport.onOpen(() => {
      count += 1;
    });
    transport.connect('ws://127.0.0.1/ws');
    off();
    instances[0]?.triggerOpen();
    expect(count).toBe(0);
  });
});

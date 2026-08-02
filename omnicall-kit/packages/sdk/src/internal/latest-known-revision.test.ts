import { describe, expect, it } from 'vitest';

import { createLatestKnownRevisionTracker } from './latest-known-revision.js';

describe('createLatestKnownRevisionTracker', () => {
  it('returns undefined before first observation', () => {
    const tracker = createLatestKnownRevisionTracker({
      getActiveIdentity: () => ({
        serverInstanceId: 'srv_a',
        sessionEpoch: 'epoch_a'
      })
    });
    expect(tracker.get()).toBeUndefined();
  });

  it('observes first revision and stays monotonic', () => {
    const tracker = createLatestKnownRevisionTracker({
      getActiveIdentity: () => ({
        serverInstanceId: 'srv_a',
        sessionEpoch: 'epoch_a'
      })
    });
    tracker.observe({
      revision: 10,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    });
    expect(tracker.get()).toBe(10);
    tracker.observe({
      revision: 12,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    });
    expect(tracker.get()).toBe(12);
    tracker.observe({
      revision: 11,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    });
    expect(tracker.get()).toBe(12);
    tracker.observe({
      revision: 12,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    });
    expect(tracker.get()).toBe(12);
  });

  it('ignores observations when active identity is missing', () => {
    const tracker = createLatestKnownRevisionTracker({
      getActiveIdentity: () => undefined
    });
    tracker.observe({
      revision: 5,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    });
    expect(tracker.get()).toBeUndefined();
  });

  it('ignores old-session / wrong-instance messages', () => {
    const tracker = createLatestKnownRevisionTracker({
      getActiveIdentity: () => ({
        serverInstanceId: 'srv_a',
        sessionEpoch: 'epoch_a'
      })
    });
    tracker.observe({
      revision: 10,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    });
    tracker.observe({
      revision: 99,
      serverInstanceId: 'srv_b',
      sessionEpoch: 'epoch_a'
    });
    tracker.observe({
      revision: 99,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_old'
    });
    expect(tracker.get()).toBe(10);
  });

  it('rejects non-integer and negative revisions', () => {
    const tracker = createLatestKnownRevisionTracker({
      getActiveIdentity: () => ({
        serverInstanceId: 'srv_a',
        sessionEpoch: 'epoch_a'
      })
    });
    tracker.observe({
      revision: 1.5,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    });
    tracker.observe({
      revision: -1,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    });
    expect(tracker.get()).toBeUndefined();
    tracker.observe({
      revision: 0,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    });
    expect(tracker.get()).toBe(0);
  });

  it('clears on invalidate and accepts new session observations', () => {
    let identity:
      | { readonly serverInstanceId: string; readonly sessionEpoch: string }
      | undefined = {
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    };
    const tracker = createLatestKnownRevisionTracker({
      getActiveIdentity: () => identity
    });
    tracker.observe({
      revision: 40,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    });
    expect(tracker.get()).toBe(40);
    tracker.clear();
    identity = undefined;
    expect(tracker.get()).toBeUndefined();
    tracker.observe({
      revision: 1,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_a'
    });
    expect(tracker.get()).toBeUndefined();
    identity = {
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_b'
    };
    tracker.observe({
      revision: 2,
      serverInstanceId: 'srv_a',
      sessionEpoch: 'epoch_b'
    });
    expect(tracker.get()).toBe(2);
  });
});

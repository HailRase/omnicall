/**
 * In-memory snapshot cache. Cleared on reconnect/revoke/disconnect.
 * Never persists secrets or authorization material.
 */

import type { SnapshotMessage } from '@axata/axatalk-protocol';

export type SnapshotCache = {
  readonly get: () => SnapshotMessage | undefined;
  readonly set: (snapshot: SnapshotMessage) => void;
  readonly clear: () => void;
  readonly getRevision: () => number | undefined;
};

export function createSnapshotCache(): SnapshotCache {
  let current: SnapshotMessage | undefined;
  return {
    get: () => current,
    set: (snapshot) => {
      current = snapshot;
    },
    clear: () => {
      current = undefined;
    },
    getRevision: () => current?.revision
  };
}

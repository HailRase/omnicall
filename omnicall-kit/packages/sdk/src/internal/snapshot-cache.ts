/**
 * In-memory snapshot cache. Cleared on reconnect/revoke/disconnect.
 * Holds the last full snapshot only — not the latest-known concurrency token
 * (`getRevision()` uses a separate tracker). Never persists secrets.
 */

import type { SnapshotMessage } from '@softomnitel/omnicall-protocol';

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

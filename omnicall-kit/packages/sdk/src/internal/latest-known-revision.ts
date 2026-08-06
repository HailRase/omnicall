/**
 * Monotonic latest-known server revision tracker (WU-03 / ADR-0027).
 * - purpose: hold concurrency token separate from honest snapshot cache
 * - inputs: validated wire revision + active serverInstanceId/sessionEpoch
 * - outputs: latest known revision or undefined before first observation / after clear
 */

export type WireRevisionObservation = {
  readonly revision: number;
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
};

export type LatestKnownRevisionTracker = {
  readonly get: () => number | undefined;
  readonly observe: (input: WireRevisionObservation) => void;
  readonly clear: () => void;
};

export function createLatestKnownRevisionTracker(deps: {
  readonly getActiveIdentity: () =>
    | { readonly serverInstanceId: string; readonly sessionEpoch: string }
    | undefined;
}): LatestKnownRevisionTracker {
  let latest: number | undefined;

  return {
    get: () => latest,
    observe: (input) => {
      if (!Number.isInteger(input.revision) || input.revision < 0) {
        return;
      }
      const active = deps.getActiveIdentity();
      if (active === undefined) {
        return;
      }
      if (
        input.serverInstanceId !== active.serverInstanceId ||
        input.sessionEpoch !== active.sessionEpoch
      ) {
        return;
      }
      if (latest === undefined || input.revision > latest) {
        latest = input.revision;
      }
    },
    clear: () => {
      latest = undefined;
    }
  };
}

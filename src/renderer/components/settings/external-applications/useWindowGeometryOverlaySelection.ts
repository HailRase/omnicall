/**
 * - Purpose: session-only overlay id selection for geometry preview.
 * - Inputs: eligible peer ids; add/remove intents from UI.
 * - Outputs: active overlay ids pruned when peers leave eligibility.
 */

import { useEffect, useMemo, useState } from "react";
import type { GeometryOverlayPeer } from "./windowGeometryOverlayTypes.js";

export type WindowGeometryOverlaySelection = Readonly<{
  activeIds: ReadonlyArray<GeometryOverlayPeer["id"]>;
  activePeers: ReadonlyArray<GeometryOverlayPeer>;
  candidates: ReadonlyArray<GeometryOverlayPeer>;
  add: (id: GeometryOverlayPeer["id"]) => void;
  remove: (id: GeometryOverlayPeer["id"]) => void;
}>;

export function useWindowGeometryOverlaySelection(
  eligiblePeers: ReadonlyArray<GeometryOverlayPeer>,
): WindowGeometryOverlaySelection {
  const [activeIds, setActiveIds] = useState<ReadonlyArray<GeometryOverlayPeer["id"]>>(
    [],
  );

  const eligibleIds = useMemo(
    () => new Set(eligiblePeers.map((peer) => peer.id)),
    [eligiblePeers],
  );

  useEffect(() => {
    setActiveIds((previous) => {
      const next = previous.filter((id) => eligibleIds.has(id));
      if (next.length === previous.length && next.every((id, index) => id === previous[index])) {
        return previous;
      }
      return next;
    });
  }, [eligibleIds]);

  const peerById = useMemo(() => {
    const map = new Map<GeometryOverlayPeer["id"], GeometryOverlayPeer>();
    for (const peer of eligiblePeers) {
      map.set(peer.id, peer);
    }
    return map;
  }, [eligiblePeers]);

  const activePeers = useMemo(
    () =>
      activeIds
        .map((id) => peerById.get(id))
        .filter((peer): peer is GeometryOverlayPeer => peer !== undefined),
    [activeIds, peerById],
  );

  const activeIdSet = useMemo(() => new Set(activeIds), [activeIds]);

  const candidates = useMemo(
    () => eligiblePeers.filter((peer) => !activeIdSet.has(peer.id)),
    [eligiblePeers, activeIdSet],
  );

  function add(id: GeometryOverlayPeer["id"]): void {
    if (!eligibleIds.has(id)) {
      return;
    }
    setActiveIds((previous) => (previous.includes(id) ? previous : [...previous, id]));
  }

  function remove(id: GeometryOverlayPeer["id"]): void {
    setActiveIds((previous) => previous.filter((entry) => entry !== id));
  }

  return { activeIds, activePeers, candidates, add, remove };
}

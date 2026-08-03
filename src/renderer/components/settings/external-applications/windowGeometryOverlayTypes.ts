/**
 * - Purpose: slim peer projection for multi-app geometry overlay preview.
 * - Inputs: External Applications list entries from the settings panel.
 * - Outputs: typed peer rows and electron_window eligibility filter helpers.
 */

import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";

export type GeometryOverlayPeer = Readonly<{
  id: ExternalApplicationsPanelApplication["id"];
  name: string;
  openMode: ExternalApplicationsPanelApplication["openMode"];
  window: ExternalApplicationsPanelApplication["window"];
}>;

export function toGeometryOverlayPeer(
  application: Pick<
    ExternalApplicationsPanelApplication,
    "id" | "name" | "openMode" | "window"
  >,
): GeometryOverlayPeer {
  return {
    id: application.id,
    name: application.name,
    openMode: application.openMode,
    window: application.window,
  };
}

export function isElectronWindowPeer(peer: GeometryOverlayPeer): boolean {
  return peer.openMode === "electron_window";
}

export function listEligibleOverlayPeers(
  peers: ReadonlyArray<GeometryOverlayPeer>,
  currentApplicationId: GeometryOverlayPeer["id"],
): ReadonlyArray<GeometryOverlayPeer> {
  return peers.filter(
    (peer) => peer.id !== currentApplicationId && isElectronWindowPeer(peer),
  );
}

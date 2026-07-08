import { useEffect, useRef } from "react";
import { resetLoadCoordinator } from "./loadCoordinator.js";
import { useShellRouteDataStore } from "./useShellRouteDataStore.js";

/**
 * - Purpose: invalidate route-scoped list loaders when active SIP profile identity changes.
 * - Inputs: composite profile sync key from account bootstrap projection.
 * - Outputs: reset route data store and load coordinator on profile switch or logout.
 */
export function useProfileScopedRouteDataReset(activeProfileSyncKey: string | null): void {
  const previousSyncKeyRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (previousSyncKeyRef.current === activeProfileSyncKey) {
      return;
    }

    previousSyncKeyRef.current = activeProfileSyncKey;
    resetLoadCoordinator();
    useShellRouteDataStore.getState().reset();
  }, [activeProfileSyncKey]);
}

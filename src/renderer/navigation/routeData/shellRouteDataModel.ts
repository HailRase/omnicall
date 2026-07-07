/**
 * - Purpose: typed route-scoped load lifecycle states for shell panels.
 * - Inputs: none.
 * - Outputs: status unions and contact snapshot shape for route read models.
 */
export type RouteDataLoadStatus =
  | "idle"
  | "loading"
  | "loaded"
  | "failed"
  | "notFound"
  | "stale";

export type ContactRouteSnapshot = Readonly<{
  id: string;
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  company: string | null;
  notes: string | null;
}>;

export type ContactRouteData = Readonly<{
  contactId: string;
  status: RouteDataLoadStatus;
  activeToken: number;
  snapshot: ContactRouteSnapshot | null;
}>;

export type ListRouteData = Readonly<{
  status: RouteDataLoadStatus;
  activeToken: number;
  inFlight: boolean;
}>;

export type ShellRouteDataState = Readonly<{
  contactsList: ListRouteData;
  historyList: ListRouteData;
  activeContact: ContactRouteData | null;
}>;

export function initialListRouteData(): ListRouteData {
  return {
    status: "idle",
    activeToken: 0,
    inFlight: false,
  };
}

export function initialShellRouteDataState(): ShellRouteDataState {
  return {
    contactsList: initialListRouteData(),
    historyList: initialListRouteData(),
    activeContact: null,
  };
}

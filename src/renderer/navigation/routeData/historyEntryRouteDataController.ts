import type { CallHistoryProjection } from "@application/projections/contacts/callHistoryProjection.js";
import type { CallHistoryEntry } from "@domain/index.js";
import type { ParsedShellRoute } from "../shellRouteModel.js";
import type { HistoryEntryRouteSnapshot, RouteDataLoadStatus } from "./shellRouteDataModel.js";

export type HistoryRouteLoadTarget =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "list" }>
  | Readonly<{
      kind: "entry";
      entryId: string;
      routeNotFound: boolean;
    }>;

/**
 * - Purpose: derive history route load intents from parsed shell routes.
 * - Inputs: parsed shell route.
 * - Outputs: list or single-entry load target without side effects.
 */
export function resolveHistoryRouteLoadTarget(route: ParsedShellRoute): HistoryRouteLoadTarget {
  if (route.name === "history") {
    return { kind: "list" };
  }

  if (route.name === "historyDetails") {
    return {
      kind: "entry",
      entryId: route.entryId,
      routeNotFound: route.notFound,
    };
  }

  return { kind: "none" };
}

export function shouldStartHistoryListLoad(input: Readonly<{
  inFlight: boolean;
}>): boolean {
  return !input.inFlight;
}

export function resolveHistoryEntryRouteInitialStatus(input: Readonly<{
  routeNotFound: boolean;
  projectionEntry: CallHistoryEntry | null;
}>): RouteDataLoadStatus {
  if (input.routeNotFound) {
    return "notFound";
  }

  if (input.projectionEntry !== null) {
    return "loaded";
  }

  return "loading";
}

export function mapHistoryEntryToRouteSnapshot(entry: CallHistoryEntry): HistoryEntryRouteSnapshot {
  return {
    id: entry.id,
    remoteNumber: entry.remoteNumber,
    displayLabel: entry.displayLabel,
    direction: entry.direction,
    outcome: entry.outcome,
    startedAt: entry.startedAt,
    endedAt: entry.endedAt,
    durationSec: entry.durationSec,
  };
}

export function findProjectionHistoryEntry(
  projection: CallHistoryProjection,
  entryId: string,
): CallHistoryEntry | null {
  return projection.entries.find((entry) => entry.id === entryId) ?? null;
}

export function isHistoryEntryRouteLoadFailureCode(code: string): boolean {
  return code === "not_found" || code === "validation_failed";
}

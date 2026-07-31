/**
 * - Purpose: map External Services query outcome to UI-safe collection summaries.
 * - Inputs: query outcome or load/error status without Domain branded types.
 * - Outputs: presentational panel view model for Settings → External Services.
 */

import type {
  ExternalServiceCollection,
  ExternalServicesSettings,
} from "@domain/index.js";
import type { QueryExternalServicesOutcome } from "../../use-cases/integration/QueryExternalServicesUseCase.js";

export type ExternalServicesCollectionVariableVm = Readonly<{
  key: string;
  value: string;
}>;

export type ExternalServicesCollectionSummaryVm = Readonly<{
  id: string;
  name: string;
  enabled: boolean;
  enabledRequestCount: number;
  requestCount: number;
  variables: ReadonlyArray<ExternalServicesCollectionVariableVm>;
}>;

export type ExternalServicesCollectionsLoadState =
  | "loading"
  | "ready"
  | "error"
  | "unavailable";

export type ExternalServicesCollectionsPanelVm = Readonly<{
  loadState: ExternalServicesCollectionsLoadState;
  settingsRevision: number;
  matchingEnabled: boolean;
  collections: ReadonlyArray<ExternalServicesCollectionSummaryVm>;
  enabledCollectionCount: number;
}>;

export function deriveExternalServicesCollectionsPanel(
  outcome: QueryExternalServicesOutcome | null,
  loadState: ExternalServicesCollectionsLoadState,
): ExternalServicesCollectionsPanelVm {
  if (outcome === null) {
    return {
      loadState,
      settingsRevision: 0,
      matchingEnabled: false,
      collections: [],
      enabledCollectionCount: 0,
    };
  }

  return {
    loadState: loadState === "loading" ? "ready" : loadState,
    settingsRevision: outcome.settingsRevision,
    matchingEnabled: outcome.matchingEnabled,
    collections: outcome.collections.map((entry) =>
      toCollectionSummary(entry.collection, entry.enabledRequestCount, entry.requestCount),
    ),
    enabledCollectionCount: outcome.enabledCollectionCount,
  };
}

export function deriveExternalServicesCollectionsFromSettings(
  settings: ExternalServicesSettings,
  settingsRevision: number,
  matchingEnabled: boolean,
): ExternalServicesCollectionsPanelVm {
  return {
    loadState: "ready",
    settingsRevision,
    matchingEnabled,
    collections: settings.collections.map((collection) =>
      toCollectionSummary(
        collection,
        collection.requests.filter((request) => request.enabled).length,
        collection.requests.length,
      ),
    ),
    enabledCollectionCount: settings.collections.filter(
      (collection) => collection.enabled,
    ).length,
  };
}

function toCollectionSummary(
  collection: ExternalServiceCollection,
  enabledRequestCount: number,
  requestCount: number,
): ExternalServicesCollectionSummaryVm {
  return {
    id: collection.id,
    name: collection.name,
    enabled: collection.enabled,
    enabledRequestCount,
    requestCount,
    variables: collection.variables.map((variable) => ({
      key: variable.key,
      value: variable.value,
    })),
  };
}

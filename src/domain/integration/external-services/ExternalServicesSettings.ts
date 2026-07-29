/**
 * - Purpose: define immutable External Services settings aggregate.
 * - Inputs: validated collections, variables, and request definitions.
 * - Outputs: profile-scoped External Services configuration.
 */

import type { ExternalServiceCollectionId } from "./ExternalServiceIds.js";
import type { ExternalServiceRequest } from "./ExternalServiceHttpDefinition.js";

export const MAX_EXTERNAL_SERVICE_NAME_LENGTH = 120;

export type ExternalServiceVariable = Readonly<{
  key: string;
  value: string;
}>;

export type ExternalServiceCollection = Readonly<{
  id: ExternalServiceCollectionId;
  name: string;
  enabled: boolean;
  variables: ReadonlyArray<ExternalServiceVariable>;
  requests: ReadonlyArray<ExternalServiceRequest>;
}>;

export type ExternalServicesSettings = Readonly<{
  collections: ReadonlyArray<ExternalServiceCollection>;
}>;

export const EXTERNAL_SERVICES_DEFAULTS: ExternalServicesSettings = Object.freeze({
  collections: Object.freeze([]),
});

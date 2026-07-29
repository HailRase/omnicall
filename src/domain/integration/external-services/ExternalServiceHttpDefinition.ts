/**
 * - Purpose: define immutable authored HTTP request configuration.
 * - Inputs: validated request fields, rows, body, and automatic triggers.
 * - Outputs: executable external-service request definitions.
 */

import type {
  ExternalServiceKeyValueId,
  ExternalServiceRequestId,
} from "./ExternalServiceIds.js";
import type { ExternalServiceAutomaticEventType } from "./ExternalServiceEventType.js";

export const EXTERNAL_SERVICE_HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;

export type ExternalServiceHttpMethod =
  (typeof EXTERNAL_SERVICE_HTTP_METHODS)[number];

export const EXTERNAL_SERVICE_BODY_MODES = [
  "none",
  "json",
  "x-www-form-urlencoded",
  "raw",
] as const;

export type ExternalServiceBodyMode =
  (typeof EXTERNAL_SERVICE_BODY_MODES)[number];

export type ExternalServiceKeyValue = Readonly<{
  id: ExternalServiceKeyValueId;
  key: string;
  value: string;
  enabled: boolean;
}>;

export type ExternalServiceRequestBody = Readonly<{
  mode: ExternalServiceBodyMode;
  value: string;
}>;

export type ExternalServiceRequest = Readonly<{
  id: ExternalServiceRequestId;
  name: string;
  enabled: boolean;
  method: ExternalServiceHttpMethod;
  url: string;
  query: ReadonlyArray<ExternalServiceKeyValue>;
  headers: ReadonlyArray<ExternalServiceKeyValue>;
  body: ExternalServiceRequestBody;
  triggers: ReadonlyArray<ExternalServiceAutomaticEventType>;
}>;

export function isExternalServiceHttpMethod(
  value: unknown,
): value is ExternalServiceHttpMethod {
  return (
    typeof value === "string" &&
    (EXTERNAL_SERVICE_HTTP_METHODS as readonly string[]).includes(value)
  );
}

export function isExternalServiceBodyMode(
  value: unknown,
): value is ExternalServiceBodyMode {
  return (
    typeof value === "string" &&
    (EXTERNAL_SERVICE_BODY_MODES as readonly string[]).includes(value)
  );
}

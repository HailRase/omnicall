/**
 * - Purpose: construct a validated outbound HTTP request from authored definition.
 * - Inputs: request definition, resolved variables, and correlation identity.
 * - Outputs: transport-ready request or deterministic validation failure.
 */
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type {
  ExternalServiceHttpMethod,
  ExternalServiceKeyValue,
  ExternalServiceRequest,
} from "../ExternalServiceHttpDefinition.js";
import type { ExternalServiceVariables } from "../template/resolveExternalServiceTemplate.js";
import { resolveExternalServiceTemplate } from "../template/resolveExternalServiceTemplate.js";

export type ExternalServiceHttpRequestBuildResult =
  | Readonly<{
      kind: "success";
      request: ExternalServiceHttpRequest;
      jsonValidity: "valid" | "invalid" | null;
    }>
  | Readonly<{
      kind: "validation_error";
      code: "invalid_url" | "unsupported_url_protocol";
    }>;

export function buildExternalServiceHttpRequest(
  definition: ExternalServiceRequest,
  variables: ExternalServiceVariables,
  correlationId: CorrelationId,
): ExternalServiceHttpRequestBuildResult {
  const urlResult = buildUrl(definition, variables);
  if (urlResult.kind === "validation_error") {
    return urlResult;
  }

  const headers = buildHeaders(definition.headers, variables, definition.body.mode);
  const body = buildBody(definition, variables);
  return {
    kind: "success",
    request: {
      method: definition.method,
      url: urlResult.url,
      headers,
      body: body.value,
      timeoutMs: 10_000,
      correlationId,
    },
    jsonValidity: body.jsonValidity,
  };
}

export type ExternalServiceHttpRequest = Readonly<{
  method: ExternalServiceHttpMethod;
  url: string;
  headers: ReadonlyArray<ExternalServiceKeyValue>;
  body: string | null;
  timeoutMs: 10_000;
  correlationId: CorrelationId;
}>;

function buildUrl(
  definition: ExternalServiceRequest,
  variables: ExternalServiceVariables,
):
  | Readonly<{ kind: "success"; url: string }>
  | Readonly<{
      kind: "validation_error";
      code: "invalid_url" | "unsupported_url_protocol";
    }> {
  const resolvedUrl = resolveExternalServiceTemplate(definition.url, variables);
  let url: URL;
  try {
    url = new URL(resolvedUrl);
  } catch {
    return { kind: "validation_error", code: "invalid_url" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { kind: "validation_error", code: "unsupported_url_protocol" };
  }
  for (const row of definition.query) {
    if (row.enabled) {
      url.searchParams.append(
        resolveExternalServiceTemplate(row.key, variables),
        resolveExternalServiceTemplate(row.value, variables),
      );
    }
  }
  return { kind: "success", url: url.toString() };
}

function buildHeaders(
  authoredHeaders: ReadonlyArray<ExternalServiceKeyValue>,
  variables: ExternalServiceVariables,
  bodyMode: ExternalServiceRequest["body"]["mode"],
): ReadonlyArray<ExternalServiceKeyValue> {
  const headers = authoredHeaders
    .filter((header) => header.enabled)
    .map((header) => ({
      ...header,
      key: resolveExternalServiceTemplate(header.key, variables),
      value: resolveExternalServiceTemplate(header.value, variables),
    }));
  return hasContentType(headers) ? headers : addDefaultContentType(headers, bodyMode);
}

function hasContentType(headers: ReadonlyArray<ExternalServiceKeyValue>): boolean {
  return headers.some((header) => header.key.trim().toLowerCase() === "content-type");
}

function addDefaultContentType(
  headers: ReadonlyArray<ExternalServiceKeyValue>,
  bodyMode: ExternalServiceRequest["body"]["mode"],
): ReadonlyArray<ExternalServiceKeyValue> {
  const value =
    bodyMode === "json"
      ? "application/json"
      : bodyMode === "x-www-form-urlencoded"
        ? "application/x-www-form-urlencoded"
        : null;
  return value === null
    ? headers
    : [
        ...headers,
        {
          id: "00000000-0000-4000-8000-000000000000" as ExternalServiceKeyValue["id"],
          key: "Content-Type",
          value,
          enabled: true,
        },
      ];
}

function buildBody(
  definition: ExternalServiceRequest,
  variables: ExternalServiceVariables,
): Readonly<{ value: string | null; jsonValidity: "valid" | "invalid" | null }> {
  if (definition.body.mode === "none") {
    return { value: null, jsonValidity: null };
  }
  const value = resolveExternalServiceTemplate(definition.body.value, variables);
  if (definition.body.mode !== "json") {
    return { value, jsonValidity: null };
  }
  return { value, jsonValidity: isJson(value) ? "valid" : "invalid" };
}

function isJson(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

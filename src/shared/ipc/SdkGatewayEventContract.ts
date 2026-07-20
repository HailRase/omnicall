/**
 * Renderer → main public SDK event publish envelope (DI-05).
 * Structural parse only; gateway validates with protocol schemas.
 */

export type SdkGatewayPublishEventIpcPayload = Readonly<{
  draft: unknown;
}>;

export type SdkGatewayPublishEventIpcResponse = Readonly<{
  ok: boolean;
  delivered: number;
}>;

export function parseSdkGatewayPublishEventIpcPayload(
  value: unknown,
): SdkGatewayPublishEventIpcPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  if (!("draft" in value)) {
    return null;
  }
  return { draft: value.draft };
}

export function parseSdkGatewayPublishEventIpcResponse(
  value: unknown,
): SdkGatewayPublishEventIpcResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  if (!("ok" in value) || !("delivered" in value)) {
    return null;
  }
  if (typeof value.ok !== "boolean" || typeof value.delivered !== "number") {
    return null;
  }
  return { ok: value.ok, delivered: value.delivered };
}

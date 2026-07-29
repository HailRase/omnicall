/**
 * - Purpose: bridge OutboundHttpPort to typed External Services preload IPC.
 * - Inputs: validated application outbound HTTP requests.
 * - Outputs: transport response or normalized network error facts.
 */

import type {
  OutboundHttpPort,
  OutboundHttpRequest,
  OutboundHttpResult,
} from "@ports/integration/OutboundHttpPort.js";
import {
  parseExternalServicesHttpRequestDto,
  parseExternalServicesHttpResponseDto,
} from "@shared/ipc/ExternalServicesHttpContract.js";

export class PreloadOutboundHttpAdapter implements OutboundHttpPort {
  async execute(request: OutboundHttpRequest): Promise<OutboundHttpResult> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return {
        kind: "network_error",
        code: "unknown",
        durationMs: 0,
        message: "Preload API is unavailable.",
      };
    }

    const payload = parseExternalServicesHttpRequestDto({
      method: request.method,
      url: request.url,
      headers: request.headers.map((header) => ({
        key: header.key,
        value: header.value,
      })),
      body: request.body,
      timeoutMs: request.timeoutMs,
      correlationId: request.correlationId,
    });
    if (payload === null) {
      return {
        kind: "network_error",
        code: "unknown",
        durationMs: 0,
        message: "Outbound HTTP request failed validation before IPC.",
      };
    }

    const response: unknown = await softphone.executeExternalServiceHttp(payload);
    const parsed = parseExternalServicesHttpResponseDto(response);
    if (parsed === null) {
      return {
        kind: "network_error",
        code: "unknown",
        durationMs: 0,
        message: "Invalid External Services HTTP IPC response.",
      };
    }
    return parsed;
  }
}

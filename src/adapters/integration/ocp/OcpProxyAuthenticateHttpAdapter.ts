/**
 * - Purpose: real HTTP adapter for GET /proxy/authenticate.
 * - Inputs: domain, login, Ocp-Proxy-Api-Key; uses fetch + AbortSignal.
 * - Outputs: softphone_auth_token | SESSION_EXIST | normalized PlatformError.
 */

import { parseOcpProxyAuthenticateResponse } from "@domain/integration/ocp/OcpProxyAuthenticateResult.js";
import type {
  OcpProxyAuthenticateInput,
  OcpProxyAuthenticateOutcome,
  OcpProxyAuthenticatePort,
} from "@ports/integration/OcpProxyAuthenticatePort.js";
import type { Logger } from "@ports/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";
/** Network timeout for HTTP authenticate (distinct from 15s OCP session wait). */
export const OCP_PROXY_AUTHENTICATE_HTTP_TIMEOUT_MS = 10_000;

export type OcpProxyAuthenticateHttpAdapterDeps = Readonly<{
  logger: Logger;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}>;

export class OcpProxyAuthenticateHttpAdapter implements OcpProxyAuthenticatePort {
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly deps: OcpProxyAuthenticateHttpAdapterDeps) {
    this.fetchImpl = deps.fetchImpl ?? fetch.bind(globalThis);
    this.timeoutMs = deps.timeoutMs ?? OCP_PROXY_AUTHENTICATE_HTTP_TIMEOUT_MS;
  }

  async authenticate(
    input: OcpProxyAuthenticateInput,
  ): Promise<Result<OcpProxyAuthenticateOutcome, PlatformError>> {
    const domain = input.domain.trim();
    const login = input.login.trim();
    const apiKey = input.apiKey.trim();

    if (domain.length === 0) {
      return err(
        createPlatformError("validation_failed", "domain_required", {
          reason: "domain_required",
        }),
      );
    }
    if (login.length === 0) {
      return err(
        createPlatformError("validation_failed", "login_required", {
          reason: "login_required",
        }),
      );
    }
    if (apiKey.length === 0) {
      return err(
        createPlatformError("validation_failed", "api_key_required", {
          reason: "api_key_required",
        }),
      );
    }

    const url = new URL(`https://${domain}/proxy/authenticate`);
    url.searchParams.set("login", login);

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      this.deps.logger.info("ocp_proxy_authenticate_requested", {
        ...(input.correlationId !== undefined
          ? { correlationId: input.correlationId }
          : {}),
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_proxy_authenticate",
        domain,
        login,
        result: "requested",
      });

      const response = await this.fetchImpl(url.toString(), {
        method: "GET",
        headers: {
          "Ocp-Proxy-Api-Key": apiKey,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        this.deps.logger.warn("ocp_proxy_authenticate_http_failed", {
          ...(input.correlationId !== undefined
            ? { correlationId: input.correlationId }
            : {}),
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_proxy_authenticate",
          domain,
          login,
          result: `http_${response.status}`,
        });
        return err(
          createPlatformError(
            "operation_failed",
            "ocp_proxy_authenticate_http_failed",
            { reason: "ocp_proxy_authenticate_http_failed", status: response.status },
          ),
        );
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch (error: unknown) {
        return err(normalizeUnknownError(error));
      }

      const parsed = parseOcpProxyAuthenticateResponse(body);
      if (!parsed.ok) {
        this.deps.logger.warn("ocp_proxy_authenticate_parse_failed", {
          ...(input.correlationId !== undefined
            ? { correlationId: input.correlationId }
            : {}),
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_proxy_authenticate",
          domain,
          login,
          result: parsed.reason,
        });
        return err(
          createPlatformError(
            "operation_failed",
            "ocp_proxy_authenticate_invalid_body",
            { reason: parsed.reason },
          ),
        );
      }

      if (parsed.kind === "session_exist") {
        this.deps.logger.info("ocp_proxy_authenticate_session_exist", {
          ...(input.correlationId !== undefined
            ? { correlationId: input.correlationId }
            : {}),
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_proxy_authenticate",
          domain,
          login,
          result: "session_exist",
        });
        return ok({ kind: "session_exist" });
      }

      this.deps.logger.info("ocp_proxy_authenticate_completed", {
        ...(input.correlationId !== undefined
          ? { correlationId: input.correlationId }
          : {}),
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_proxy_authenticate",
        domain,
        login,
        result: "token",
      });
      return ok({ kind: "token", token: parsed.token });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        return err(
          createPlatformError(
            "timeout",
            "ocp_proxy_authenticate_http_timeout",
            { reason: "ocp_proxy_authenticate_http_timeout" },
          ),
        );
      }
      return err(normalizeUnknownError(error));
    } finally {
      clearTimeout(timer);
    }
  }
}

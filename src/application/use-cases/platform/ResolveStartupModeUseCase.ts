import {
  createAccessDeniedDetectedEvent,
  createStartupModeResolvedEvent,
  type StartupResolution,
} from "@domain/index.js";
import type { AppBootstrapConfig } from "@domain/index.js";
import type { DomainEventPublisher } from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

export type ResolveStartupModeInput = Readonly<{
  config: AppBootstrapConfig;
  correlationId?: CorrelationId;
}>;

export type ResolveStartupModeOutput = Readonly<{
  resolution: StartupResolution;
}>;

export class ResolveStartupModeUseCase {
  constructor(
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  execute(
    input: ResolveStartupModeInput,
  ): Result<ResolveStartupModeOutput, never> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const resolution = resolveStartupResolution(input.config);

    this.eventPublisher.publish(
      createStartupModeResolvedEvent(correlationId, {
        mode: input.config.mode,
        resolution,
      }),
    );

    if (resolution.action === "access_denied") {
      this.eventPublisher.publish(
        createAccessDeniedDetectedEvent(correlationId, {
          source: "ocp",
          reason: resolution.reason,
        }),
      );
    }

    this.logger.info("startup_mode_resolved", {
      correlationId,
      featureId: "F-009",
      boundedContext: "Operator",
      operation: "resolve_startup_mode",
      result: resolution.action,
    });

    return ok({ resolution });
  }
}

function resolveStartupResolution(
  config: AppBootstrapConfig,
): StartupResolution {
  if (config.mode === "sip-only") {
    return { action: "sip_only_ready" };
  }

  const token = config.ocpToken?.trim() ?? "";
  const domain = config.ocpDomain?.trim() ?? "";

  if (token.length === 0 || domain.length === 0) {
    return {
      action: "access_denied",
      reason: "OCP mode requires token and domain",
    };
  }

  return { action: "ocp_authenticate", token, domain };
}

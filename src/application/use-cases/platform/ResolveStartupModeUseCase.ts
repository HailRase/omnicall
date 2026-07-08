import {
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
    const resolution: StartupResolution = { action: "sip_only_ready" };

    this.eventPublisher.publish(
      createStartupModeResolvedEvent(correlationId, { resolution }),
    );

    this.logger.info("startup_mode_resolved", {
      correlationId,
      featureId: "F-009",
      boundedContext: "Settings",
      operation: "resolve_startup_mode",
      result: resolution.action,
    });

    return ok({ resolution });
  }
}

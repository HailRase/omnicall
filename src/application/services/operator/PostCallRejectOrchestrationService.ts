import type { CallId } from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { isErr } from "@shared/result/index.js";
import type { AgentStatusReadModel, Logger } from "@ports/index.js";
import type { UpdatePostCallStatusUseCase } from "../../use-cases/operator/UpdatePostCallStatusUseCase.js";

/**
 * - Purpose: trigger OCP post-call update after incoming reject with reason (LF-062).
 * - Inputs: call ID, break reason, agent OCP availability.
 * - Outputs: optional `UpdatePostCallStatusUseCase` invocation.
 */
export class PostCallRejectOrchestrationService {
  constructor(
    private readonly agentStatusReadModel: AgentStatusReadModel,
    private readonly updatePostCallStatus: UpdatePostCallStatusUseCase,
    private readonly logger: Logger,
  ) {}

  async handleRejectedCall(
    callId: CallId,
    breakReason: string,
    correlationId: CorrelationId,
  ): Promise<void> {
    const snapshot = this.agentStatusReadModel.getSnapshot();
    if (!snapshot.isOcpStatusAvailable) {
      return;
    }

    const result = await this.updatePostCallStatus.execute({
      callId,
      breakReason,
      correlationId,
    });

    if (isErr(result)) {
      this.logger.warn("post_call_reject_orchestration_failed", {
        correlationId,
        featureId: "F-010",
        boundedContext: "Operator",
        operation: "post_call_reject_orchestration",
        result: result.error.code,
      });
      return;
    }

    this.logger.info("post_call_reject_orchestration_succeeded", {
      correlationId,
      featureId: "F-010",
      boundedContext: "Operator",
      operation: "post_call_reject_orchestration",
      result: "succeeded",
    });
  }
}

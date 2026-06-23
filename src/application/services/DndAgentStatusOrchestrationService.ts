import { mapDndToAgentBreakRequest, type PhoneStatus } from "@domain/index.js";
import type { AgentStatusReadModel, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { isErr } from "@shared/result/index.js";
import type { ChangeAgentStatusUseCase } from "../use-cases/ChangeAgentStatusUseCase.js";

/**
 * - Purpose: orchestrate DND phone presence to agent break request (LF-018).
 * - Inputs: phone status and current agent status read model.
 * - Outputs: optional `ChangeAgentStatusUseCase` invocation.
 */
export class DndAgentStatusOrchestrationService {
  constructor(
    private readonly agentStatusReadModel: AgentStatusReadModel,
    private readonly changeAgentStatus: ChangeAgentStatusUseCase,
    private readonly logger: Logger,
  ) {}

  async handlePhoneStatusChanged(
    phoneStatus: PhoneStatus,
    correlationId?: CorrelationId,
  ): Promise<void> {
    const snapshot = this.agentStatusReadModel.getSnapshot();
    const action = mapDndToAgentBreakRequest(
      phoneStatus,
      snapshot.currentStatus,
      snapshot.isOcpStatusAvailable,
    );

    if (action.action !== "request_break") {
      return;
    }

    const operationCorrelationId = correlationId ?? createCorrelationId();
    const result = await this.changeAgentStatus.execute({
      targetStatus: "break",
      correlationId: operationCorrelationId,
      trigger: "phone_dnd",
    });

    if (isErr(result)) {
      this.logger.warn("dnd_agent_break_orchestration_failed", {
        correlationId: operationCorrelationId,
        featureId: "F-010",
        boundedContext: "Operator",
        operation: "dnd_agent_break_orchestration",
        trigger: action.trigger,
        result: result.error.code,
      });
      return;
    }

    this.logger.info("dnd_agent_break_orchestration_succeeded", {
      correlationId: operationCorrelationId,
      featureId: "F-010",
      boundedContext: "Operator",
      operation: "dnd_agent_break_orchestration",
      trigger: action.trigger,
      result: "succeeded",
    });
  }
}

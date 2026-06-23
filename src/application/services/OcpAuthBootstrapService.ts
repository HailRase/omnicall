import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { AgentStatusSyncService } from "./AgentStatusSyncService.js";
import type { BreakReasonsSyncService } from "./BreakReasonsSyncService.js";
import type { DndAgentStatusOrchestrationService } from "./DndAgentStatusOrchestrationService.js";
import type { Logger, SettingsRepository } from "@ports/index.js";

/**
 * - Purpose: run OCP post-auth sync chain including DND-at-auth edge case.
 * - Inputs: OCP auth success correlation ID.
 * - Outputs: agent status sync, break reasons sync, optional DND orchestration.
 */
export class OcpAuthBootstrapService {
  constructor(
    private readonly agentStatusSync: AgentStatusSyncService,
    private readonly breakReasonsSync: BreakReasonsSyncService,
    private readonly dndOrchestration: DndAgentStatusOrchestrationService,
    private readonly settingsRepository: SettingsRepository,
    private readonly logger: Logger,
  ) {}

  async afterOcpAuthSucceeded(correlationId: CorrelationId): Promise<void> {
    await this.agentStatusSync.syncAfterOcpAuth(correlationId);
    await this.breakReasonsSync.syncAfterOcpAuth(correlationId);

    const phoneStatus = await this.settingsRepository.getPhoneStatus();
    if (phoneStatus !== "dnd") {
      return;
    }

    await this.dndOrchestration.handlePhoneStatusChanged("dnd", correlationId);
    this.logger.info("dnd_at_auth_orchestration_triggered", {
      correlationId,
      featureId: "F-010",
      boundedContext: "Operator",
      operation: "ocp_auth_bootstrap",
      result: "dnd_orchestration",
    });
  }
}

/**
 * - Purpose: thin application wrapper for domain agent status transition rules.
 * - Inputs: current/target status and transition context.
 * - Outputs: validation result for Use Cases and tests (WU2).
 */
import {
  validateAgentStatusTransition,
  type AgentStatusTransitionContext,
  type AgentStatusTransitionResult,
} from "@domain/index.js";
import type { AgentStatus } from "@domain/index.js";

export class AgentStatusValidationService {
  validateTransition(
    current: AgentStatus,
    target: AgentStatus,
    context: AgentStatusTransitionContext,
  ): AgentStatusTransitionResult {
    return validateAgentStatusTransition(current, target, context);
  }
}

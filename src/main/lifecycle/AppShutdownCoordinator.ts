import type { AppShutdownAction } from "@shared/platform/AppLifecycle.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type AppShutdownCoordinatorPhase = "idle" | "awaiting-cleanup" | "completing";

export type BeginShutdownResult = "started" | "already_in_progress";

export type CompleteShutdownResult = "quit" | "restart" | "rejected";
export type CancelShutdownResult = "cancelled" | "rejected";

/**
 * - Purpose: idempotent shutdown coordinator for quit and restart intents (LF-079).
 * - Inputs: correlation id and shutdown action.
 * - Outputs: begin/complete/cancel results without duplicate cleanup triggers.
 */
export class AppShutdownCoordinator {
  private phase: AppShutdownCoordinatorPhase = "idle";
  private pendingCorrelationId: CorrelationId | null = null;
  private pendingAction: AppShutdownAction = "quit";

  getPhase(): AppShutdownCoordinatorPhase {
    return this.phase;
  }

  isBusy(): boolean {
    return this.phase !== "idle";
  }

  beginShutdown(correlationId: CorrelationId, action: AppShutdownAction): BeginShutdownResult {
    if (this.phase !== "idle") {
      return "already_in_progress";
    }

    this.phase = "awaiting-cleanup";
    this.pendingCorrelationId = correlationId;
    this.pendingAction = action;
    return "started";
  }

  completeShutdown(
    correlationId: CorrelationId,
    action: AppShutdownAction,
  ): CompleteShutdownResult {
    if (this.phase !== "awaiting-cleanup") {
      return "rejected";
    }

    if (this.pendingCorrelationId !== correlationId || this.pendingAction !== action) {
      return "rejected";
    }

    this.phase = "completing";
    return action === "restart" ? "restart" : "quit";
  }

  cancelShutdown(correlationId: CorrelationId, action: AppShutdownAction): CancelShutdownResult {
    if (this.phase !== "awaiting-cleanup") {
      return "rejected";
    }

    if (this.pendingCorrelationId !== correlationId || this.pendingAction !== action) {
      return "rejected";
    }

    this.phase = "idle";
    this.pendingCorrelationId = null;
    this.pendingAction = "quit";
    return "cancelled";
  }
}

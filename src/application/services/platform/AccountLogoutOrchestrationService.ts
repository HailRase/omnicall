import type { PlatformError } from "@shared/errors/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import { err, isErr, ok } from "@shared/result/index.js";

export type AccountLogoutOutcome = Readonly<{
  ocpStep: "operator_logout" | "disconnect" | "not_connected";
  sipSessionEnded: true;
  operatorSnapshotMissing: boolean;
}>;

export type AccountLogoutOrchestrationDeps = Readonly<{
  readOcpSession: () => Readonly<{
    isAuthenticated: boolean;
    isLive: boolean;
    hasOperatorSnapshot: boolean;
  }>;
  logoutOperator: (reasonId: number) => Promise<Result<void, PlatformError>>;
  disconnectOcp: () => Promise<Result<void, PlatformError>>;
  endUserSession: () => Promise<Result<unknown, PlatformError>>;
  /**
   * Disarm Application-owned OCP transport recovery before intentional disconnect
   * so logout is not mistaken for an unexpected socket drop (ADR-AF-002).
   */
  disarmOcpTransportRecovery?: () => void;
  /** Reset OCP projections to cold-start idle after intentional session end. */
  resetOcpProjectionsToIdle?: () => void;
  /**
   * If intentional logout fails before disconnect, restore recovery tracking
   * for the still-authorized live session.
   */
  restoreOcpTransportRecoveryTracking?: () => void;
}>;

export class AccountLogoutOrchestrationService {
  constructor(private readonly deps: AccountLogoutOrchestrationDeps) {}

  async execute(input: Readonly<{ reasonId?: number }> = {}): Promise<
    Result<AccountLogoutOutcome, PlatformError>
  > {
    const session = this.deps.readOcpSession();
    if (session.isAuthenticated && session.hasOperatorSnapshot && input.reasonId === undefined) {
      return err(
        createPlatformError("validation_failed", "ocp_logout_reason_required", {
          reason: "ocp_logout_reason_required",
        }),
      );
    }

    // Must run before gateway disconnect — recovery arms synchronously on drop.
    this.deps.disarmOcpTransportRecovery?.();

    const ocpResult = await this.endOcpSession(session, input.reasonId);
    if (isErr(ocpResult)) {
      this.deps.restoreOcpTransportRecoveryTracking?.();
      return ocpResult;
    }

    this.deps.resetOcpProjectionsToIdle?.();

    const sipResult = await this.deps.endUserSession();
    if (isErr(sipResult)) {
      return sipResult;
    }
    return ok({
      ocpStep: ocpResult.value,
      sipSessionEnded: true,
      operatorSnapshotMissing: session.isAuthenticated && !session.hasOperatorSnapshot,
    });
  }

  private endOcpSession(
    session: ReturnType<AccountLogoutOrchestrationDeps["readOcpSession"]>,
    reasonId: number | undefined,
  ): Promise<Result<AccountLogoutOutcome["ocpStep"], PlatformError>> {
    if (session.isAuthenticated && session.hasOperatorSnapshot && reasonId !== undefined) {
      return this.deps.logoutOperator(reasonId).then((result) =>
        isErr(result) ? result : ok("operator_logout" as const),
      );
    }
    if (session.isLive) {
      return this.deps.disconnectOcp().then((result) =>
        isErr(result) ? result : ok("disconnect" as const),
      );
    }
    return Promise.resolve(ok("not_connected" as const));
  }
}

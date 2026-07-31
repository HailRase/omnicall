/**
 * Narrow Application port for SDK operator/logout (DI-07 / ADR-0017 O-OCP-1).
 * Bound to AccountBootstrapFacade — no OCP wire / secrets across the boundary.
 */

import type { ChangeOperatorStatusOutcome } from "../use-cases/integration/ocp/ChangeOperatorStatusUseCase.js";
import type { AccountLogoutOutcome } from "../services/platform/AccountLogoutOrchestrationService.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type SdkOperatorReasonKind = "ready" | "break" | "logout";

export type SdkOperatorReasonDto = Readonly<{
  id: number;
  label: string;
  kind: SdkOperatorReasonKind;
}>;

export type SdkOcpSessionView = Readonly<{
  isAuthenticated: boolean;
  isLive: boolean;
  hasOperatorSnapshot: boolean;
}>;

export type ExternalSdkOperatorPort = Readonly<{
  changeOperatorStatus: (input: {
    readonly targetStatus: "ready" | "break";
    readonly reasonId: number;
  }) => Promise<Result<ChangeOperatorStatusOutcome, PlatformError>>;
  finishPostCallAppeal: () => Promise<
    Result<ChangeOperatorStatusOutcome, PlatformError>
  >;
  listOperatorReasons: () => ReadonlyArray<SdkOperatorReasonDto>;
  readOcpSession: () => SdkOcpSessionView;
  logoutAccountSession: (input?: {
    readonly reasonId?: number;
  }) => Promise<Result<AccountLogoutOutcome, PlatformError>>;
}>;

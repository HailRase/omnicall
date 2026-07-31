/**
 * Bind F-028 Facade host methods to ExternalSdkOperatorPort (DI-07 / ADR-0017 O-OCP-1).
 * Always uses callType "sdk" at the Facade — never silent "external".
 * OCP WebSocket wire still receives function_call_type "external" via
 * `mapOcpCallTypeToWire` (legacy proxy_users accepts only internal|external).
 */

import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

import type { ChangeOperatorStatusOutcome } from "../use-cases/integration/ocp/ChangeOperatorStatusUseCase.js";
import type { AccountLogoutOutcome } from "../services/platform/AccountLogoutOrchestrationService.js";

import type { ExternalSdkOperatorPort } from "./ExternalSdkOperatorPort.js";
import {
  mapSdkOperatorReasons,
  type SdkOperatorReasonsProjection,
} from "./mapSdkOperatorReasons.js";

export type SdkOperatorFacadeSessionSnapshot = Readonly<{
  isAuthenticated: boolean;
  connectionState: string;
}>;

export type SdkOperatorFacadeOperatorSnapshot = Readonly<{
  operatorId: number | null;
}>;

export type SdkOperatorFacadeBinding = Readonly<{
  changeOcpStatusFromHost: (input: {
    readonly targetStatus: "ready" | "break";
    readonly reasonId: number;
    readonly callType?: "external" | "sdk";
  }) => Promise<Result<ChangeOperatorStatusOutcome, PlatformError>>;
  finishOcpPostCallAppeal: (input?: {
    readonly callType?: "internal" | "external" | "sdk";
  }) => Promise<Result<ChangeOperatorStatusOutcome, PlatformError>>;
  getOcpReasonsSnapshot: () => SdkOperatorReasonsProjection;
  getOcpSessionSnapshot: () => SdkOperatorFacadeSessionSnapshot;
  getOcpOperatorSnapshot: () => SdkOperatorFacadeOperatorSnapshot;
  logoutAccountSession: (input?: {
    readonly reasonId?: number;
  }) => Promise<Result<AccountLogoutOutcome, PlatformError>>;
}>;

export type CreateSdkOperatorPortFromFacadeOptions = Readonly<{
  facade: SdkOperatorFacadeBinding;
  /** When false/undefined, SIP-only: empty reasons and no fabricated OCP session. */
  ocpModuleEnabled?: boolean;
}>;

/**
 * - Purpose: single composition binding for SDK operator/logout → Facade.
 * - Outputs: narrow port; status mutations always carry callType "sdk".
 */
export function createSdkOperatorPortFromFacade(
  options: CreateSdkOperatorPortFromFacadeOptions,
): ExternalSdkOperatorPort {
  const ocpEnabled = options.ocpModuleEnabled === true;
  const { facade } = options;
  return {
    changeOperatorStatus: (input) =>
      facade.changeOcpStatusFromHost({
        targetStatus: input.targetStatus,
        reasonId: input.reasonId,
        callType: "sdk",
      }),
    finishPostCallAppeal: () =>
      facade.finishOcpPostCallAppeal({
        callType: "sdk",
      }),
    listOperatorReasons: () => {
      if (!ocpEnabled) {
        return [];
      }
      return mapSdkOperatorReasons(facade.getOcpReasonsSnapshot());
    },
    readOcpSession: () => {
      if (!ocpEnabled) {
        return {
          isAuthenticated: false,
          isLive: false,
          hasOperatorSnapshot: false,
        };
      }
      const session = facade.getOcpSessionSnapshot();
      const operator = facade.getOcpOperatorSnapshot();
      return {
        isAuthenticated: session.isAuthenticated,
        isLive:
          session.connectionState === "connected" ||
          session.connectionState === "authenticated" ||
          session.connectionState === "connecting" ||
          session.connectionState === "reconnecting",
        hasOperatorSnapshot: operator.operatorId !== null,
      };
    },
    logoutAccountSession: (input) => facade.logoutAccountSession(input ?? {}),
  };
}

/**
 * Options / start-result types for LocalWsServerAdapter (DI-03/DI-04/DI-11).
 */

import type { SdkOriginTrustEntry } from "@domain/index.js";
import type { SecretStoragePort } from "@ports/secrets/SecretStoragePort.js";

import type { SdkGatewayLimits } from "./sdkGatewayConfig.js";
import type { SdkGatewayLogFn } from "./localWsServerHelpers.js";
import type {
  SdkOriginTrustApprover,
  SdkOriginTrustPending,
} from "./sdkGatewayOriginTrustApprover.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import type {
  SdkPairingApprover,
  SdkPairingPendingRequest,
} from "./sdkGatewayPairingTypes.js";

export type LocalWsStartResult =
  | { readonly ok: true; readonly host: string; readonly port: number }
  | {
      readonly ok: false;
      readonly reason:
        | "disabled"
        | "not_primary_instance"
        | "invalid_bind_host"
        | "missing_secret_storage"
        | "bind_failed"
        | "already_listening"
        | "shutting_down";
    };

export type LocalWsServerAdapterOptions = Readonly<{
  desktopVersion: string;
  host?: string;
  port?: number;
  enabled?: boolean;
  mayClaimEndpoint?: () => boolean;
  limits?: Partial<SdkGatewayLimits>;
  now?: () => Date;
  onLog?: SdkGatewayLogFn;
  /**
   * DI-11 Origin trust store. When omitted, `allowedOrigins` (if provided) or env
   * seed are converted to allowed entries for test / boot compat.
   */
  originTrustEntries?: readonly SdkOriginTrustEntry[];
  /** Flat allowlist seed for DI-04 fortress test compat; prefer originTrustEntries. */
  allowedOrigins?: readonly string[];
  secretStorage?: SecretStoragePort;
  pairingApprover?: SdkPairingApprover;
  autoApprovePairing?: boolean;
  originTrustApprover?: SdkOriginTrustApprover;
  /** Test helper: auto-allow unknown Origins (production upgrade rejects unknown). */
  autoAllowOriginTrust?: boolean;
  /** DI-05 product surface (broker + window). Absent → product cmds stay not_ready. */
  productSurface?: SdkGatewayProductSurface;
  /** Persist Origin trust mutations from Settings / test helpers (main wires this). */
  onOriginTrustChanged?: (entries: readonly SdkOriginTrustEntry[]) => void;
  /**
   * Fired when a deferred Origin-trust request awaits operator decision (legacy/test path).
   * Production admission is Trusted sites / seed (ADR-0018 amended 2026-08-03).
   * Main may use this for shell raise (ADR-0013). Not used with auto-allow.
   */
  onOriginTrustPending?: (pending: SdkOriginTrustPending) => void;
  /**
   * Fired when a new deferred pairing request awaits operator decision.
   * Main uses this for shell raise + Settings attention (ADR-0013).
   */
  onPairingPending?: (pending: SdkPairingPendingRequest) => void;
}>;

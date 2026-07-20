/**
 * Options / start-result types for LocalWsServerAdapter (DI-03/DI-04).
 */

import type { SecretStoragePort } from "@ports/secrets/SecretStoragePort.js";

import type { SdkGatewayLimits } from "./sdkGatewayConfig.js";
import type { SdkGatewayLogFn } from "./localWsServerHelpers.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import type { SdkPairingApprover } from "./sdkGatewayPairingTypes.js";

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
  allowedOrigins?: readonly string[];
  secretStorage?: SecretStoragePort;
  pairingApprover?: SdkPairingApprover;
  autoApprovePairing?: boolean;
  /** DI-05 product surface (broker + window). Absent → product cmds stay not_ready. */
  productSurface?: SdkGatewayProductSurface;
}>;

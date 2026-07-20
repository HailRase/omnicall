/**
 * - Purpose: re-export allowlisted SDK gateway operational projection types (DI-09).
 * - Source of truth for wire shape: shared IPC contract (renderer/main boundary).
 */

export type {
  SdkActivateGrantResultProjection,
  SdkGatewayDiagnosticsProjection,
  SdkGatewayOperationalStatus,
  SdkPairedClientProjection,
  SdkPendingPairingProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";

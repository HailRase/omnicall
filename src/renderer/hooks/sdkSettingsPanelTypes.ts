import type { SdkIntegrationSettings } from "@application/index.js";
import type {
  SdkGatewayDiagnosticsProjection,
  SdkPairedClientProjection,
  SdkPendingPairingProjection,
  SdkPendingOriginTrustProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import type { SdkOriginCapabilityMatrix } from "@application/index.js";
import type { SdkOperatorModalTimeouts } from "@shared/integration/sdkOperatorModalTimeouts.js";

export type SdkSettingsPanelErrorKey =
  | "settings.integrations.sdk.error.saveFailed"
  | "settings.integrations.sdk.error.originsInvalid"
  | "settings.integrations.sdk.error.gatewayFailed"
  | "settings.integrations.sdk.error.revokeFailed";

export type UseSdkSettingsPanelResult = Readonly<{
  settings: SdkIntegrationSettings;
  diagnostics: SdkGatewayDiagnosticsProjection;
  allowedOriginsLive: readonly string[];
  pairedClients: readonly SdkPairedClientProjection[];
  pendingPairing: readonly SdkPendingPairingProjection[];
  pendingOriginTrust: readonly SdkPendingOriginTrustProjection[];
  addOriginDraft: string;
  errorKey: SdkSettingsPanelErrorKey | null;
  busy: boolean;
  onAddOriginDraftChange: (value: string) => void;
  onAddOrigin: (draft?: string) => void;
  onRefresh: () => void;
  onApprovePairing: (pairingRequestId: string) => void;
  onDenyPairing: (pairingRequestId: string) => void;
  onRevokeClient: (clientId: string, origin: string) => void;
  onAllowOriginTrust: (originTrustRequestId: string) => void;
  onDenyOriginTrust: (originTrustRequestId: string) => void;
  onCancelOriginTrust: (originTrustRequestId: string) => void;
  onUnblockOrigin: (origin: string) => void;
  onBlacklistOrigin: (origin: string) => void;
  onRemoveAllowedOrigin: (origin: string) => void;
  onRenameAllowedOrigin: (previousOrigin: string, nextOrigin: string) => void;
  onSetOriginMatrix: (
    origin: string,
    matrix: SdkOriginCapabilityMatrix,
  ) => void;
  onOperatorModalTimeoutsChange: (
    next: Partial<SdkOperatorModalTimeouts>,
  ) => void;
}>;

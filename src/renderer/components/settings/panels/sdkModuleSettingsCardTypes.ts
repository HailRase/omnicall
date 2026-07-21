import type { SdkIntegrationSettings } from "@application/index.js";
import type {
  SdkSettingsPanelErrorKey,
  SdkProfileOption,
} from "../../../hooks/useSdkSettingsPanel.js";
import type {
  SdkActivateGrantResultProjection,
  SdkGatewayDiagnosticsProjection,
  SdkPairedClientProjection,
  SdkPendingPairingProjection,
  SdkPendingOriginTrustProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import type { SdkOriginCapabilityMatrix } from "@application/index.js";

export type SdkModuleSettingsCardProps = Readonly<{
  settings: SdkIntegrationSettings;
  diagnostics: SdkGatewayDiagnosticsProjection;
  allowedOriginsLive: readonly string[];
  pairedClients: readonly SdkPairedClientProjection[];
  pendingPairing: readonly SdkPendingPairingProjection[];
  pendingOriginTrust: readonly SdkPendingOriginTrustProjection[];
  profileOptions: readonly SdkProfileOption[];
  selectedClientId: string | null;
  selectedProfileId: string | null;
  lastGrant: SdkActivateGrantResultProjection | null;
  addOriginDraft: string;
  errorKey: SdkSettingsPanelErrorKey | null;
  busy: boolean;
  onAddOriginDraftChange: (value: string) => void;
  onAddOrigin: (draft?: string) => void;
  onRefresh: () => void;
  onApprovePairing: (pairingRequestId: string) => void;
  onDenyPairing: (pairingRequestId: string) => void;
  onRevokeClient: (clientId: string) => void;
  onSelectClientId: (clientId: string | null) => void;
  onSelectProfileId: (profileId: string | null) => void;
  onIssueActivateGrant: () => void;
  onAllowOriginTrust: (requestId: string) => void;
  onDenyOriginTrust: (requestId: string) => void;
  onUnblockOrigin: (origin: string) => void;
  onBlacklistOrigin: (origin: string) => void;
  onRemoveAllowedOrigin: (origin: string) => void;
  onRenameAllowedOrigin: (previousOrigin: string, nextOrigin: string) => void;
  onSetOriginMatrix: (origin: string, matrix: SdkOriginCapabilityMatrix) => void;
}>;

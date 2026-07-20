import type { SdkIntegrationSettings } from "@application/index.js";
import type {
  SdkActivateGrantResultProjection,
  SdkGatewayDiagnosticsProjection,
  SdkPairedClientProjection,
  SdkPendingPairingProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";

export type SdkSettingsPanelErrorKey =
  | "settings.integrations.sdk.error.saveFailed"
  | "settings.integrations.sdk.error.originsInvalid"
  | "settings.integrations.sdk.error.gatewayFailed"
  | "settings.integrations.sdk.error.revokeFailed"
  | "settings.integrations.sdk.error.grantFailed";

export type SdkProfileOption = Readonly<{
  id: string;
  label: string;
}>;

export type UseSdkSettingsPanelResult = Readonly<{
  settings: SdkIntegrationSettings;
  diagnostics: SdkGatewayDiagnosticsProjection;
  allowedOriginsLive: readonly string[];
  pairedClients: readonly SdkPairedClientProjection[];
  pendingPairing: readonly SdkPendingPairingProjection[];
  profileOptions: readonly SdkProfileOption[];
  selectedClientId: string | null;
  selectedProfileId: string | null;
  lastGrant: SdkActivateGrantResultProjection | null;
  originsDraft: string;
  errorKey: SdkSettingsPanelErrorKey | null;
  busy: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onOriginsDraftChange: (value: string) => void;
  onOriginsSave: () => void;
  onRefresh: () => void;
  onApprovePairing: (pairingRequestId: string) => void;
  onDenyPairing: (pairingRequestId: string) => void;
  onRevokeClient: (clientId: string) => void;
  onSelectClientId: (clientId: string | null) => void;
  onSelectProfileId: (profileId: string | null) => void;
  onIssueActivateGrant: () => void;
}>;

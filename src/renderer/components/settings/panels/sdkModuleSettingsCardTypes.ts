import type { SdkIntegrationSettings } from "@application/index.js";
import type { SdkSettingsPanelErrorKey } from "../../../hooks/useSdkSettingsPanel.js";
import type {
  SdkGatewayDiagnosticsProjection,
  SdkPairedClientProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";
import type { SdkOriginCapabilityMatrix } from "@application/index.js";
import type { SdkOperatorModalTimeouts } from "@shared/integration/sdkOperatorModalTimeouts.js";

export type SdkModuleSettingsCardProps = Readonly<{
  settings: SdkIntegrationSettings;
  diagnostics: SdkGatewayDiagnosticsProjection;
  allowedOriginsLive: readonly string[];
  pairedClients: readonly SdkPairedClientProjection[];
  addOriginDraft: string;
  errorKey: SdkSettingsPanelErrorKey | null;
  busy: boolean;
  onAddOriginDraftChange: (value: string) => void;
  onAddOrigin: (draft?: string) => void;
  onRefresh: () => void;
  onRevokeClient: (clientId: string) => void;
  onUnblockOrigin: (origin: string) => void;
  onBlacklistOrigin: (origin: string) => void;
  onRemoveAllowedOrigin: (origin: string) => void;
  onRenameAllowedOrigin: (previousOrigin: string, nextOrigin: string) => void;
  onSetOriginMatrix: (origin: string, matrix: SdkOriginCapabilityMatrix) => void;
  onOperatorModalTimeoutsChange: (
    next: Partial<SdkOperatorModalTimeouts>,
  ) => void;
}>;

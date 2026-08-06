/**
 * - Purpose: paired clients list for SDK Settings (hide is Origin-matrix governed).
 */

import type { JSX } from "react";
import type { SdkPairedClientProjection } from "@shared/ipc/SdkGatewaySettingsContract.js";
import { SdkModuleSettingsPairedSection } from "./SdkModuleSettingsPairedSection.js";

type Props = Readonly<{
  pairedClients: readonly SdkPairedClientProjection[];
  busy: boolean;
  onRevokeClient: (clientId: string, origin: string) => void;
}>;

/** Paired clients section (window.hide lives in Origin matrix — ADR-0013). */
export function SdkModuleSettingsClientsSection(props: Props): JSX.Element {
  return (
    <SdkModuleSettingsPairedSection
      pairedClients={props.pairedClients}
      busy={props.busy}
      onRevokeClient={props.onRevokeClient}
    />
  );
}

/**
 * Narrow product-state view for SDK snapshot assembly (DI-05).
 * Built from Application projections — never Domain Events or OCP wire.
 */

import type { CallState, RegistrationState } from "@domain/index.js";
import type { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";

export type SdkProductCallLine = Readonly<{
  callId: string;
  state: CallState | "Idle";
  direction: "inbound" | "outbound";
  remoteNumber: string | null;
  remoteDisplayName: string | null;
  muted: boolean;
  /** Non-empty ACD queue title from OCP call context; null when absent. */
  queueLabel: string | null;
}>;

/** Active campaign offer fields for snapshot (pre-redaction). */
export type SdkProductCampaignOffer = Readonly<{
  campaignId: string;
  progressive: boolean;
  clientPhone: string;
  companyTitle: string;
  strategyTitle: string;
  selectionTitle: string;
  queueTitle: string;
}>;

export type SdkProductStateSnapshot = Readonly<{
  signedIn: boolean;
  profileLabel: string | null;
  registrationState: RegistrationState;
  registrationReasonCode: string | null;
  calls: readonly SdkProductCallLine[];
  ocpEnabled: boolean;
  ocpConnected: boolean;
  operatorStatus: OperatorStatus | null;
  operatorReasonId: number | null;
  operatorReasonLabelKey: string | null;
  /** Local post-call booking (Ready/Break); null when idle / cleared. */
  reservedStatus: OperatorStatus | null;
  reservedReasonId: number | null;
  /** Preview or progressive campaign slot; null when cleared. */
  activeCampaign: SdkProductCampaignOffer | null;
}>;

export type SdkProductStateReader = () => SdkProductStateSnapshot;

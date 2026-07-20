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
}>;

export type SdkProductStateReader = () => SdkProductStateSnapshot;

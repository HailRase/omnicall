/**
 * Assemble redacted public snapshot product sections (DI-05 / ADR-0012/0017).
 * Session + window sections are merged in main (connection / BrowserWindow).
 */

import type { WireJsonObject } from "@axata/axatalk-protocol";

import { mapSdkOperatorStatus } from "./mapSdkOperatorStatus.js";
import { mapSdkPublicCallState } from "./mapSdkPublicCallState.js";
import { mapSdkRegistrationState } from "./mapSdkRegistrationState.js";
import {
  redactDisplayNameForSdk,
  redactPhoneForSdk,
} from "./sdkPrivacyRedaction.js";
import type {
  SdkProductCallLine,
  SdkProductStateSnapshot,
} from "./ExternalSdkProductState.js";

export type SdkSnapshotProductSections = Readonly<{
  account: WireJsonObject;
  registration: WireJsonObject;
  calls: readonly WireJsonObject[];
  operator?: WireJsonObject;
}>;

export type AssembleSdkSnapshotOptions = Readonly<{
  getOwnerClientId?: (callId: string) => string | undefined;
}>;

export function assembleSdkSnapshotProductSections(
  state: SdkProductStateSnapshot,
  options: AssembleSdkSnapshotOptions = {},
): SdkSnapshotProductSections {
  const account: WireJsonObject = {
    signedIn: state.signedIn,
    ...(state.profileLabel !== null && state.profileLabel.length > 0
      ? { profileLabel: state.profileLabel.slice(0, 128) }
      : {}),
  };
  const registration: WireJsonObject = {
    state: mapSdkRegistrationState(state.registrationState),
    ...(state.registrationReasonCode !== null
      ? { reasonCode: state.registrationReasonCode.slice(0, 64) }
      : {}),
  };
  const calls = state.calls
    .map((line) => mapCallLine(line, options.getOwnerClientId?.(line.callId)))
    .filter((line): line is WireJsonObject => line !== null)
    .slice(0, 32);

  if (!state.ocpEnabled) {
    return { account, registration, calls };
  }

  return {
    account,
    registration,
    calls,
    operator: {
      connected: state.ocpConnected,
      ...(state.ocpConnected
        ? {
            status: mapSdkOperatorStatus(state.operatorStatus),
            ...(state.operatorReasonId !== null
              ? { reasonId: state.operatorReasonId }
              : {}),
            ...(state.operatorReasonLabelKey !== null
              ? { reasonLabelKey: state.operatorReasonLabelKey.slice(0, 128) }
              : {}),
          }
        : {}),
    },
  };
}

function mapCallLine(
  line: SdkProductCallLine,
  ownerClientId: string | undefined,
): WireJsonObject | null {
  const state = mapSdkPublicCallState(line.state);
  if (state === null) {
    return null;
  }
  return {
    callId: line.callId,
    state,
    direction: line.direction,
    ...(line.remoteNumber !== null
      ? { remoteNumber: redactPhoneForSdk(line.remoteNumber) }
      : {}),
    ...(line.remoteDisplayName !== null
      ? { remoteDisplayName: redactDisplayNameForSdk(line.remoteDisplayName) }
      : {}),
    muted: line.muted,
    ...(ownerClientId !== undefined ? { ownerClientId } : {}),
  };
}

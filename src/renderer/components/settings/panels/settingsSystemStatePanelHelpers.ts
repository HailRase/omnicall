import type {
  OcpAuthorizationState,
  OcpServerState,
  SipSystemStateShellView,
} from "@application/index.js";

export type SipStateIndicatorTone = "positive" | "progress" | "negative" | "neutral";

type SipTransportState = SipSystemStateShellView["transportState"];
type SipRegistrationState = SipSystemStateShellView["registrationState"];

export function deriveTransportIndicatorTone(state: SipTransportState): SipStateIndicatorTone {
  switch (state) {
    case "connected":
      return "positive";
    case "connecting":
    case "reconnecting":
      return "progress";
    case "disconnected":
      return "negative";
    case "idle":
      return "neutral";
  }
}

export function deriveRegistrationIndicatorTone(
  state: SipRegistrationState,
): SipStateIndicatorTone {
  switch (state) {
    case "registered":
      return "positive";
    case "registering":
      return "progress";
    case "failed":
      return "negative";
    case "idle":
      return "neutral";
  }
}

export function deriveSummaryIndicatorTone(
  transport: SipTransportState,
  registration: SipRegistrationState,
): SipStateIndicatorTone {
  if (transport === "connected" && registration === "registered") {
    return "positive";
  }
  if (
    transport === "connecting" ||
    transport === "reconnecting" ||
    registration === "registering"
  ) {
    return "progress";
  }
  if (transport === "disconnected" || registration === "failed") {
    return "negative";
  }
  return "neutral";
}

export function isIntervalBelowMinimum(value: number, minimum: number): boolean {
  return Number.isFinite(value) && value < minimum;
}

export function deriveOcpServerIndicatorTone(state: OcpServerState): SipStateIndicatorTone {
  switch (state) {
    case "connected":
      return "positive";
    case "connecting":
    case "reconnecting":
      return "progress";
    case "failed":
    case "disconnected":
      return "negative";
  }
}

export function deriveOcpAuthorizationIndicatorTone(
  state: OcpAuthorizationState,
): SipStateIndicatorTone {
  switch (state.phase) {
    case "authorized":
      return "positive";
    case "pending":
      return "progress";
    case "timeout":
    case "rejected":
      return "negative";
    case "idle":
      return "neutral";
  }
}

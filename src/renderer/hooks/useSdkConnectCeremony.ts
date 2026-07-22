/**
 * Derive root SDK connect ceremony (Origin TOFU → pairing) from gateway snapshot.
 * Presentation-only; IPC decisions stay on useSdkSettingsPanel callbacks.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SdkPendingOriginTrustProjection,
  SdkPendingPairingProjection,
} from "@shared/ipc/SdkGatewaySettingsContract.js";

const WAITING_PAIRING_TIMEOUT_MS = 45_000;

export type SdkConnectCeremonyStep = "transport" | "waiting" | "pairing";

export type SdkConnectCeremonyView =
  | Readonly<{ open: false }>
  | Readonly<{
      open: true;
      step: SdkConnectCeremonyStep;
      origin: string;
      showStepper: boolean;
      originTrustRequestId: string | null;
      pairing: SdkPendingPairingProjection | null;
    }>;

export type UseSdkConnectCeremonyInput = Readonly<{
  pendingOriginTrust: readonly SdkPendingOriginTrustProjection[];
  pendingPairing: readonly SdkPendingPairingProjection[];
  busy: boolean;
  /** True when Origin is still `allowed` in trust store (Approve guard). */
  isOriginAllowed: (origin: string) => boolean;
  onAllowOriginTrust: (originTrustRequestId: string) => void;
  onDenyOriginTrust: (originTrustRequestId: string) => void;
  onApprovePairing: (pairingRequestId: string) => void;
  onDenyPairing: (pairingRequestId: string) => void;
}>;

export type UseSdkConnectCeremonyResult = Readonly<{
  view: SdkConnectCeremonyView;
  busy: boolean;
  onAllowTransport: () => void;
  onDenyTransport: () => void;
  onApprovePairing: () => void;
  onDenyPairing: () => void;
  onCancelWaiting: () => void;
  onDismiss: () => void;
}>;

function pairingForOrigin(
  list: readonly SdkPendingPairingProjection[],
  origin: string,
): SdkPendingPairingProjection | null {
  return list.find((item) => item.origin === origin) ?? null;
}

function buildCeremonyView(input: {
  trust: SdkPendingOriginTrustProjection | null;
  bridgeOrigin: string | null;
  twoStep: boolean;
  pendingPairing: readonly SdkPendingPairingProjection[];
}): SdkConnectCeremonyView {
  const { trust, bridgeOrigin, twoStep, pendingPairing } = input;
  const trustStillOpen =
    trust !== null && (bridgeOrigin === null || bridgeOrigin !== trust.origin);
  if (trustStillOpen && trust !== null) {
    return {
      open: true,
      step: "transport",
      origin: trust.origin,
      showStepper: true,
      originTrustRequestId: trust.originTrustRequestId,
      pairing: null,
    };
  }
  const bridged = bridgeOrigin !== null ? pairingForOrigin(pendingPairing, bridgeOrigin) : null;
  if (bridgeOrigin !== null && bridged === null) {
    return {
      open: true,
      step: "waiting",
      origin: bridgeOrigin,
      showStepper: true,
      originTrustRequestId: null,
      pairing: null,
    };
  }
  const pairing = bridged ?? (bridgeOrigin === null ? (pendingPairing[0] ?? null) : null);
  if (pairing === null) {
    return { open: false };
  }
  return {
    open: true,
    step: "pairing",
    origin: pairing.origin,
    showStepper: twoStep || bridgeOrigin !== null,
    originTrustRequestId: null,
    pairing,
  };
}

/** Map pending Origin trust + pairing into one root ceremony view. */
export function useSdkConnectCeremony(
  input: UseSdkConnectCeremonyInput,
): UseSdkConnectCeremonyResult {
  const {
    pendingOriginTrust,
    pendingPairing,
    busy,
    isOriginAllowed,
    onAllowOriginTrust,
    onDenyOriginTrust,
    onApprovePairing,
    onDenyPairing,
  } = input;

  const [bridgeOrigin, setBridgeOrigin] = useState<string | null>(null);
  const [twoStep, setTwoStep] = useState(false);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewRef = useRef<SdkConnectCeremonyView>({ open: false });

  const clearWaitTimer = useCallback((): void => {
    if (waitTimerRef.current !== null) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }, []);

  const clearBridge = useCallback((): void => {
    clearWaitTimer();
    setBridgeOrigin(null);
    setTwoStep(false);
  }, [clearWaitTimer]);

  useEffect(() => () => clearWaitTimer(), [clearWaitTimer]);

  useEffect(() => {
    if (bridgeOrigin === null) {
      return;
    }
    if (pairingForOrigin(pendingPairing, bridgeOrigin) !== null) {
      clearWaitTimer();
      return;
    }
    if (waitTimerRef.current !== null) {
      return;
    }
    waitTimerRef.current = setTimeout(() => {
      waitTimerRef.current = null;
      setBridgeOrigin(null);
      setTwoStep(false);
    }, WAITING_PAIRING_TIMEOUT_MS);
  }, [bridgeOrigin, pendingPairing, clearWaitTimer]);

  const trust = pendingOriginTrust[0] ?? null;
  const view = buildCeremonyView({ trust, bridgeOrigin, twoStep, pendingPairing });
  viewRef.current = view;

  const onAllowTransport = useCallback((): void => {
    const current = viewRef.current;
    if (!current.open || current.step !== "transport" || current.originTrustRequestId === null) {
      return;
    }
    setTwoStep(true);
    setBridgeOrigin(current.origin);
    onAllowOriginTrust(current.originTrustRequestId);
  }, [onAllowOriginTrust]);

  const onDenyTransport = useCallback((): void => {
    const current = viewRef.current;
    if (!current.open || current.step !== "transport" || current.originTrustRequestId === null) {
      return;
    }
    clearBridge();
    onDenyOriginTrust(current.originTrustRequestId);
  }, [clearBridge, onDenyOriginTrust]);

  const onApprovePairingStep = useCallback((): void => {
    const current = viewRef.current;
    if (!current.open || current.pairing === null) {
      return;
    }
    if (!isOriginAllowed(current.pairing.origin)) {
      clearBridge();
      onDenyPairing(current.pairing.pairingRequestId);
      return;
    }
    clearBridge();
    onApprovePairing(current.pairing.pairingRequestId);
  }, [clearBridge, isOriginAllowed, onApprovePairing, onDenyPairing]);

  const onDenyPairingStep = useCallback((): void => {
    const current = viewRef.current;
    if (!current.open || current.pairing === null) {
      return;
    }
    clearBridge();
    onDenyPairing(current.pairing.pairingRequestId);
  }, [clearBridge, onDenyPairing]);

  const onCancelWaiting = useCallback((): void => {
    clearBridge();
  }, [clearBridge]);

  const onDismiss = useCallback((): void => {
    const current = viewRef.current;
    if (!current.open) {
      return;
    }
    if (current.step === "transport") {
      onDenyTransport();
      return;
    }
    if (current.step === "pairing") {
      onDenyPairingStep();
      return;
    }
    if (current.step === "waiting") {
      onCancelWaiting();
    }
  }, [onDenyTransport, onDenyPairingStep, onCancelWaiting]);

  return {
    view,
    busy,
    onAllowTransport,
    onDenyTransport,
    onApprovePairing: onApprovePairingStep,
    onDenyPairing: onDenyPairingStep,
    onCancelWaiting,
    onDismiss,
  };
}

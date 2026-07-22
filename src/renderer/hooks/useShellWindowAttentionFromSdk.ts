/**
 * Hook: SDK operator-attention side effects in renderer (ADR-0013).
 * Native raise for TOFU/pairing is owned by main; activate consent raises via IPC.
 * Pairing / Origin trust decisions use the root SdkConnectCeremonyModal (no Settings redirect).
 */

import { useEffect, useRef } from "react";
import type { SdkActivateConsentPending } from "@application/integration/DeferredSdkActivateConsent.js";
import type {
  ShellOperatorAttentionPayload,
  ShellWindowRaisePayload,
} from "@shared/ipc/ShellWindowRaiseContract.js";

type UseShellWindowAttentionFromSdkInput = Readonly<{
  activateConsentPending: SdkActivateConsentPending | null;
  refreshSdkSnapshot?: () => void;
  raiseWindow?: (payload: ShellWindowRaisePayload) => Promise<unknown>;
  onOperatorAttention?: (
    handler: (payload: ShellOperatorAttentionPayload) => void,
  ) => () => void;
}>;

function defaultRaiseWindow(payload: ShellWindowRaisePayload): Promise<unknown> {
  return window.softphone.raiseShellWindow(payload);
}

function defaultOnOperatorAttention(
  handler: (payload: ShellOperatorAttentionPayload) => void,
): () => void {
  return window.softphone.onShellOperatorAttention(handler);
}

/**
 * - Activate consent: raise when pending appears (edge; consent lives in renderer).
 * - Pairing / Origin trust: main raises; refresh snapshot so the root ceremony modal updates.
 */
export function useShellWindowAttentionFromSdk(
  input: UseShellWindowAttentionFromSdkInput,
): void {
  const { activateConsentPending, refreshSdkSnapshot } = input;
  const raiseWindow = input.raiseWindow ?? defaultRaiseWindow;
  const onOperatorAttention =
    input.onOperatorAttention ?? defaultOnOperatorAttention;
  const raisedActivateRef = useRef<string | null>(null);

  useEffect(() => {
    if (activateConsentPending === null) {
      raisedActivateRef.current = null;
      return;
    }
    const key = `${activateConsentPending.origin}:${activateConsentPending.profileLabel}`;
    if (raisedActivateRef.current === key) {
      return;
    }
    raisedActivateRef.current = key;
    void raiseWindow({
      reason: "sdk_activate_consent",
      dedupeKey: key,
    });
  }, [activateConsentPending, raiseWindow]);

  useEffect(() => {
    return onOperatorAttention(() => {
      refreshSdkSnapshot?.();
    });
  }, [refreshSdkSnapshot, onOperatorAttention]);
}

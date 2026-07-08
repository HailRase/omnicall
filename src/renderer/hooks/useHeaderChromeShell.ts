import { useMemo } from "react";
import { deriveHeaderChromeShell } from "@application/index.js";
import { useSipRecoveryCountdownTick } from "./useSipRecoveryCountdownTick.js";
import { useSoftphoneProjections } from "./useSoftphoneProjections.js";

type UseHeaderChromeShellInput = Readonly<{
  dndEnabled: boolean;
  sipAutoReconnectEnabled: boolean;
  sipAutoReregisterEnabled: boolean;
}>;

/**
 * - Purpose: bind SIP session health projection to header chrome view-model.
 * - Inputs: recovery policy toggles and DND flag from user settings / projection.
 * - Outputs: header chrome shell view-model with live recovery countdown suffix.
 */
export function useHeaderChromeShell(input: UseHeaderChromeShellInput) {
  const { projection, sipSessionHealthProjection } = useSoftphoneProjections();
  const tickMs = useSipRecoveryCountdownTick(sipSessionHealthProjection);

  return useMemo(
    () =>
      deriveHeaderChromeShell({
        health: sipSessionHealthProjection,
        agentId: null,
        sipUsername: projection.sipUsername,
        dndEnabled: input.dndEnabled,
        sipAutoReconnectEnabled: input.sipAutoReconnectEnabled,
        sipAutoReregisterEnabled: input.sipAutoReregisterEnabled,
        nowMs: tickMs,
      }),
    [
      sipSessionHealthProjection,
      projection.sipUsername,
      input.dndEnabled,
      input.sipAutoReconnectEnabled,
      input.sipAutoReregisterEnabled,
      tickMs,
    ],
  );
}

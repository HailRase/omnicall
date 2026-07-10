import { describe, expect, it } from "vitest";
import type { CallLineCardViewModel } from "../telephony/deriveCallLinesShell.js";
import { initialActiveCallControlsProjection } from "../telephony/activeCallControlsProjection.js";
import {
  applyHeadsetSyncBusyToActiveCallControls,
  applyHeadsetSyncBusyToCallLine,
} from "./applyHeadsetSyncBusyToActiveCallControls.js";
import { initialHeadsetSyncBusyProjection } from "./headsetSyncBusyProjection.js";

function line(partial: Partial<CallLineCardViewModel> = {}): CallLineCardViewModel {
  return {
    callId: "active-1",
    role: "primary",
    state: "Active",
    muted: false,
    isActiveUnheld: true,
    displayName: "Alice",
    statusLabel: "call.line.status.active",
    durationStartedAt: 1,
    primaryAction: "hangup",
    showIconRow: true,
    showLocalHoldBadge: false,
    showRemoteHoldBadge: false,
    resumeDisabledReason: null,
    hangupDisabledReason: null,
    holdDisabledReason: null,
    muteDisabledReason: null,
    unmuteDisabledReason: "not_muted",
    transferDisabledReason: null,
    ...partial,
  };
}

describe("applyHeadsetSyncBusy", () => {
  it("blocks only mute controls while mute sync is pending", () => {
    const projection = {
      ...initialActiveCallControlsProjection(),
      callId: "active-1",
      callState: "Active" as const,
      muted: false,
      muteDisabledReason: null,
      unmuteDisabledReason: "not_muted" as const,
      holdDisabledReason: null,
      resumeDisabledReason: "resume_requires_held" as const,
    };

    const next = applyHeadsetSyncBusyToActiveCallControls(projection, {
      ...initialHeadsetSyncBusyProjection(),
      muteSessionId: "active-1",
      isBusy: true,
    });

    expect(next.muteDisabledReason).toBe("headset_sync_in_progress");
    expect(next.unmuteDisabledReason).toBe("headset_sync_in_progress");
    expect(next.holdDisabledReason).toBeNull();
    expect(next.resumeDisabledReason).toBe("resume_requires_held");
  });

  it("blocks only hold/resume while hold sync is pending", () => {
    const next = applyHeadsetSyncBusyToCallLine(line(), {
      ...initialHeadsetSyncBusyProjection(),
      holdSessionId: "active-1",
      isBusy: true,
    });

    expect(next.holdDisabledReason).toBe("headset_sync_in_progress");
    expect(next.resumeDisabledReason).toBe("headset_sync_in_progress");
    expect(next.muteDisabledReason).toBeNull();
  });

  it("does not affect unrelated sessions", () => {
    const next = applyHeadsetSyncBusyToCallLine(line({ callId: "other" }), {
      muteSessionId: "active-1",
      holdSessionId: null,
      isBusy: true,
    });
    expect(next.muteDisabledReason).toBeNull();
    expect(next.holdDisabledReason).toBeNull();
  });
});

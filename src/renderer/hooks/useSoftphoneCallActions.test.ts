// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type {
  ActiveCallControlsProjection,
  CallProjection,
} from "@application/index.js";
import { useSoftphoneCallActions } from "./useSoftphoneCallActions.js";

const idleCallProjection: CallProjection = {
  activeCallId: null,
  state: "Idle",
  mode: "number",
  dtmfPanelCallId: null,
  uiState: "idle",
  lastError: null,
  lastDtmfError: null,
  lastDtmfTone: null,
  muted: false,
  remoteAudioAttached: false,
  toneIndicator: "none",
};

const idleControls: ActiveCallControlsProjection = {
  callId: null,
  callState: "Idle",
  muted: false,
  holdDisabledReason: null,
  resumeDisabledReason: null,
  muteDisabledReason: null,
  unmuteDisabledReason: null,
  hangupDisabledReason: null,
  lastOperationError: null,
};

describe("useSoftphoneCallActions", () => {
  it("starts audio call by default", () => {
    const makeCall = vi.fn().mockResolvedValue({ ok: true as const, value: {} });
    const facade = { makeCall } as unknown as AccountBootstrapFacade;
    const { result } = renderHook(() =>
      useSoftphoneCallActions({
        facade,
        callProjection: idleCallProjection,
        activeCallControlsProjection: idleControls,
        dialedNumber: "1202",
        callDisabledReason: null,
        videoCallDisabledReason: null,
      }),
    );

    result.current.handleDialpadCall();
    expect(makeCall).toHaveBeenCalledWith("1202");
  });

  it("starts video call with mediaMode video", () => {
    const makeCall = vi.fn().mockResolvedValue({ ok: true as const, value: {} });
    const facade = { makeCall } as unknown as AccountBootstrapFacade;
    const { result } = renderHook(() =>
      useSoftphoneCallActions({
        facade,
        callProjection: idleCallProjection,
        activeCallControlsProjection: idleControls,
        dialedNumber: "1202",
        callDisabledReason: null,
        videoCallDisabledReason: null,
      }),
    );

    result.current.handleDialpadVideoCall();
    expect(makeCall).toHaveBeenCalledWith("1202", undefined, "video");
  });

  it("does not start video call when disabled", () => {
    const makeCall = vi.fn().mockResolvedValue({ ok: true as const, value: {} });
    const facade = { makeCall } as unknown as AccountBootstrapFacade;
    const { result } = renderHook(() =>
      useSoftphoneCallActions({
        facade,
        callProjection: idleCallProjection,
        activeCallControlsProjection: idleControls,
        dialedNumber: "1202",
        callDisabledReason: null,
        videoCallDisabledReason: "Camera unavailable",
      }),
    );

    result.current.handleDialpadVideoCall();
    expect(makeCall).not.toHaveBeenCalled();
  });
});

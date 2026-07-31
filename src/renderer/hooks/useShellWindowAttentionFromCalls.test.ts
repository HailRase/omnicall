// @vitest-environment jsdom
/**
 * Unit tests for telephony → shell raise edge hooks.
 */

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  initialCallProjection,
  initialIncomingCallProjection,
  type CallProjection,
  type IncomingCallProjection,
} from "@application/index.js";
import { useShellWindowAttentionFromCalls } from "./useShellWindowAttentionFromCalls.js";

describe("useShellWindowAttentionFromCalls", () => {
  it("raises once for incoming ring per callId", () => {
    const raiseWindow = vi.fn().mockResolvedValue({ ok: true });
    const incoming: IncomingCallProjection = {
      ...initialIncomingCallProjection(),
      visible: true,
      callId: "in_1",
      uiState: "incomingRinging",
    };

    const { rerender } = renderHook(
      (props: {
        incomingCallProjection: IncomingCallProjection;
        callProjection: CallProjection;
      }) =>
        useShellWindowAttentionFromCalls({
          ...props,
          raiseWindow,
        }),
      {
        initialProps: {
          incomingCallProjection: incoming,
          callProjection: initialCallProjection(),
        },
      },
    );

    expect(raiseWindow).toHaveBeenCalledTimes(1);
    expect(raiseWindow).toHaveBeenCalledWith({
      reason: "incoming_call",
      dedupeKey: "in_1",
    });

    rerender({
      incomingCallProjection: { ...incoming },
      callProjection: initialCallProjection(),
    });
    expect(raiseWindow).toHaveBeenCalledTimes(1);
  });

  it("raises once for outgoing Connecting per callId", () => {
    const raiseWindow = vi.fn().mockResolvedValue({ ok: true });
    const callProjection: CallProjection = {
      ...initialCallProjection(),
      activeCallId: "out_1",
      state: "Connecting",
      uiState: "calling",
    };

    const { rerender } = renderHook(
      (props: {
        incomingCallProjection: IncomingCallProjection;
        callProjection: CallProjection;
      }) =>
        useShellWindowAttentionFromCalls({
          ...props,
          raiseWindow,
        }),
      {
        initialProps: {
          incomingCallProjection: initialIncomingCallProjection(),
          callProjection,
        },
      },
    );

    expect(raiseWindow).toHaveBeenCalledWith({
      reason: "outgoing_call",
      dedupeKey: "out_1",
    });

    rerender({
      incomingCallProjection: initialIncomingCallProjection(),
      callProjection: { ...callProjection },
    });
    expect(raiseWindow).toHaveBeenCalledTimes(1);
  });
});

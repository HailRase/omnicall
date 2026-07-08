// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  initialIncomingCallProjection,
  type IncomingCallProjection,
} from "@application/index.js";
import { useIncomingCallOverlayShell } from "./useIncomingCallOverlayShell.js";

function ringingProjection(callId: string): IncomingCallProjection {
  return {
    ...initialIncomingCallProjection(),
    visible: true,
    callId,
    callerNumber: "+12025550100",
    uiState: "incomingRinging",
    ringingIndicator: "ringing",
  };
}

const baseInput = {
  projection: ringingProjection("call-a"),
  shellRouteName: "history" as const,
  incomingSessionCardVisible: true,
};

describe("useIncomingCallOverlayShell", () => {
  it("shows overlay for incoming call on non-dialpad routes", () => {
    const { result } = renderHook(() =>
      useIncomingCallOverlayShell({
        incomingCallProjection: baseInput.projection,
        shellRouteName: baseInput.shellRouteName,
        incomingSessionCardVisible: baseInput.incomingSessionCardVisible,
      }),
    );

    expect(result.current.visible).toBe(true);
  });

  it("hides overlay on dialpad when inline session card is visible", () => {
    const { result } = renderHook(() =>
      useIncomingCallOverlayShell({
        incomingCallProjection: ringingProjection("call-a"),
        shellRouteName: "dialpad",
        incomingSessionCardVisible: true,
      }),
    );

    expect(result.current.visible).toBe(false);
  });

  it("shows overlay on dialpad when inline session card is hidden by call UI mode", () => {
    const { result } = renderHook(() =>
      useIncomingCallOverlayShell({
        incomingCallProjection: ringingProjection("call-a"),
        shellRouteName: "dialpad",
        incomingSessionCardVisible: false,
      }),
    );

    expect(result.current.visible).toBe(true);
  });

  it("hides overlay after dismiss for the same callId", () => {
    const { result, rerender } = renderHook(
      (input: typeof baseInput) =>
        useIncomingCallOverlayShell({
          incomingCallProjection: input.projection,
          shellRouteName: input.shellRouteName,
          incomingSessionCardVisible: input.incomingSessionCardVisible,
        }),
      { initialProps: baseInput },
    );

    act(() => {
      result.current.handleDismiss();
    });

    expect(result.current.visible).toBe(false);

    rerender(baseInput);
    expect(result.current.visible).toBe(false);
  });

  it("shows overlay again for a new callId after dismiss", () => {
    const { result, rerender } = renderHook(
      (input: typeof baseInput) =>
        useIncomingCallOverlayShell({
          incomingCallProjection: input.projection,
          shellRouteName: input.shellRouteName,
          incomingSessionCardVisible: input.incomingSessionCardVisible,
        }),
      { initialProps: baseInput },
    );

    act(() => {
      result.current.handleDismiss();
    });

    rerender({
      ...baseInput,
      projection: ringingProjection("call-b"),
    });

    expect(result.current.visible).toBe(true);
  });

  it("clears dismiss state when incoming ends", () => {
    const { result, rerender } = renderHook(
      (input: typeof baseInput) =>
        useIncomingCallOverlayShell({
          incomingCallProjection: input.projection,
          shellRouteName: input.shellRouteName,
          incomingSessionCardVisible: input.incomingSessionCardVisible,
        }),
      { initialProps: baseInput },
    );

    act(() => {
      result.current.handleDismiss();
    });

    rerender({
      ...baseInput,
      projection: initialIncomingCallProjection(),
    });
    rerender({
      ...baseInput,
      projection: ringingProjection("call-a"),
    });

    expect(result.current.visible).toBe(true);
  });
});

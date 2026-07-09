import { describe, expect, it } from "vitest";
import {
  createCallId,
  createCallMediaModeSelectedEvent,
  createLocalVideoMutedChangedEvent,
  createRemoteVideoPresenceChangedEvent,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  initialCallVideoMediaUiProjection,
  reduceCallVideoMediaUiProjection,
} from "./callVideoMediaUiProjection.js";

describe("callVideoMediaUiProjection", () => {
  it("stores video mode on CallMediaModeSelected", () => {
    const callId = createCallId("call-1");
    const next = reduceCallVideoMediaUiProjection(
      initialCallVideoMediaUiProjection(),
      createCallMediaModeSelectedEvent(createCorrelationId(), callId, "video"),
    );
    expect(next.byCallId[callId]?.mediaMode).toBe("video");
    expect(next.byCallId[callId]?.localVideoMuted).toBe(true);
  });

  it("updates mute and remote presence", () => {
    const callId = createCallId("call-2");
    const correlationId = createCorrelationId();
    let state = reduceCallVideoMediaUiProjection(
      initialCallVideoMediaUiProjection(),
      createCallMediaModeSelectedEvent(correlationId, callId, "video"),
    );
    state = reduceCallVideoMediaUiProjection(
      state,
      createLocalVideoMutedChangedEvent(correlationId, callId, false),
    );
    state = reduceCallVideoMediaUiProjection(
      state,
      createRemoteVideoPresenceChangedEvent(correlationId, callId, true),
    );
    expect(state.byCallId[callId]?.localVideoMuted).toBe(false);
    expect(state.byCallId[callId]?.remoteVideoPresent).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CallLineCardViewModel } from "./deriveCallLinesShell.js";
import { deriveCallControlTarget } from "./deriveCallControlTarget.js";
import {
  initialIncomingCallProjection,
  reduceIncomingCallProjection,
} from "./incomingCallProjection.js";

const activeLine: CallLineCardViewModel = {
  callId: "call-active",
  role: "primary",
  state: "Active",
  muted: false,
  isActiveUnheld: true,
  displayName: "+12025550100",
  statusLabel: "call.line.status.active",
  durationStartedAt: Date.now(),
  queueLabelState: "hidden",
  queueName: null,
  primaryAction: "hangup",
  showIconRow: true,
  showLocalHoldBadge: false,
  showRemoteHoldBadge: false,
  resumeDisabledReason: null,
  hangupDisabledReason: null,
  holdDisabledReason: null,
  muteDisabledReason: null,
  unmuteDisabledReason: null,
  transferDisabledReason: null,
};

const heldLine: CallLineCardViewModel = {
  ...activeLine,
  callId: "call-held",
  state: "Held",
  isActiveUnheld: false,
  statusLabel: "call.line.status.held",
};

function ringingIncomingProjection(callId: string) {
  const correlationId = createCorrelationId();
  const received = reduceIncomingCallProjection(initialIncomingCallProjection(), {
    type: "IncomingCallReceived",
    correlationId,
    occurredAt: new Date().toISOString(),
    callId,
    phoneNumber: "+12025550999",
    direction: "incoming",
  });
  return reduceIncomingCallProjection(received, {
    type: "IncomingCallRingingStarted",
    correlationId,
    occurredAt: new Date().toISOString(),
    callId,
    autoAnswerTimeoutSec: null,
    autoAnswerExpiresAt: null,
  });
}

describe("deriveCallControlTarget", () => {
  it("returns explicitly selected established line while incoming is ringing", () => {
    const incomingProjection = ringingIncomingProjection("call-incoming");

    const target = deriveCallControlTarget({
      selectedCallId: "call-active",
      lines: [activeLine],
      incomingCallId: "call-incoming",
      incomingCallProjection: incomingProjection,
      contacts: [],
    });

    expect(target?.callId).toBe("call-active");
    expect(target?.state).toBe("Active");
  });

  it("returns incoming control line when incoming is selected", () => {
    const incomingProjection = ringingIncomingProjection("call-incoming");

    const target = deriveCallControlTarget({
      selectedCallId: "call-incoming",
      lines: [activeLine],
      incomingCallId: "call-incoming",
      incomingCallProjection: incomingProjection,
      contacts: [],
    });

    expect(target?.callId).toBe("call-incoming");
    expect(target?.state).toBe("Ringing");
    expect(target?.primaryAction).toBe("answer");
  });

  it("falls back to active unheld line when selection is cleared", () => {
    const incomingProjection = ringingIncomingProjection("call-incoming");

    const target = deriveCallControlTarget({
      selectedCallId: null,
      lines: [activeLine, heldLine],
      incomingCallId: "call-incoming",
      incomingCallProjection: incomingProjection,
      contacts: [],
    });

    expect(target?.callId).toBe("call-active");
  });
});

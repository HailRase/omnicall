import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  initialIncomingCallProjection,
  reduceIncomingCallProjection,
  type IncomingCallProjection,
} from "./incomingCallProjection.js";
import {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
  type MultiLineCallProjection,
} from "./multiLineCallProjection.js";
import {
  applyCallFocusSelectionIntent,
  initialCallFocusProjection,
  reduceCallFocusProjection,
  type CallFocusProjection,
} from "./callFocusProjection.js";
import type { DomainEvent } from "@domain/index.js";

const occurredAt = "2026-07-30T07:00:00.000Z";

function event(type: string, payload: Readonly<Record<string, unknown>> = {}): DomainEvent {
  return {
    type,
    correlationId: createCorrelationId(),
    occurredAt,
    ...payload,
  };
}

function commit(
  state: Readonly<{
    focus: CallFocusProjection;
    lines: MultiLineCallProjection;
    incoming: IncomingCallProjection;
  }>,
  nextEvent: DomainEvent,
) {
  const lines = reduceMultiLineCallProjection(state.lines, nextEvent);
  const incoming = reduceIncomingCallProjection(state.incoming, nextEvent);
  return {
    lines,
    incoming,
    focus: reduceCallFocusProjection(state.focus, nextEvent, {
      multiLineCallProjection: lines,
      incomingCallProjection: incoming,
    }),
  };
}

function initialState() {
  return {
    focus: initialCallFocusProjection(),
    lines: initialMultiLineCallProjection(),
    incoming: initialIncomingCallProjection(),
  };
}

describe("callFocusProjection", () => {
  it("focuses a new incoming line before its ringing trigger", () => {
    const state = commit(initialState(), event("IncomingCallReceived", {
      callId: "incoming-1",
      phoneNumber: "100",
      direction: "incoming",
    }));

    expect(state.focus.focusedCallId).toBe("incoming-1");
  });

  it("focuses a new outgoing line when no incoming call is waiting", () => {
    const state = commit(initialState(), event("OutgoingCallRequested", {
      callId: "outgoing-1",
      phoneNumber: "200",
    }));

    expect(state.focus.focusedCallId).toBe("outgoing-1");
    expect(state.focus.explicitCallId).toBe("outgoing-1");
  });

  it("preserves explicit selection while its line remains alive", () => {
    let state = commit(initialState(), event("OutgoingCallRequested", {
      callId: "active-1",
      phoneNumber: "100",
    }));
    state = commit(state, event("CallAnswered", { callId: "active-1" }));
    state = commit(state, event("OutgoingCallRequested", {
      callId: "active-2",
      phoneNumber: "200",
    }));
    state = {
      ...state,
      focus: applyCallFocusSelectionIntent("active-1", {
        multiLineCallProjection: state.lines,
        incomingCallProjection: state.incoming,
      }),
    };
    state = commit(state, event("CallHeld", { callId: "active-1" }));

    expect(state.focus.focusedCallId).toBe("active-1");
  });

  it("retains focus for a terminal event, then falls back on the next event", () => {
    let state = commit(initialState(), event("OutgoingCallRequested", {
      callId: "call-1",
      phoneNumber: "100",
    }));
    state = commit(state, event("CallAnswered", { callId: "call-1" }));
    state = commit(state, event("OutgoingCallRequested", {
      callId: "call-2",
      phoneNumber: "200",
    }));
    state = {
      ...state,
      focus: applyCallFocusSelectionIntent("call-1", {
        multiLineCallProjection: state.lines,
        incomingCallProjection: state.incoming,
      }),
    };
    state = commit(state, event("CallEnded", { callId: "call-1" }));

    expect(state.focus.focusedCallId).toBe("call-1");

    state = commit(state, event("CallHeld", { callId: "call-2" }));
    expect(state.focus.focusedCallId).toBe("call-2");
  });

  it("deterministically focuses the latest of two rapid incoming lines", () => {
    let state = commit(initialState(), event("IncomingCallReceived", {
      callId: "incoming-1",
      phoneNumber: "100",
      direction: "incoming",
    }));
    state = commit(state, event("IncomingCallReceived", {
      callId: "incoming-2",
      phoneNumber: "200",
      direction: "incoming",
    }));

    expect(state.focus.focusedCallId).toBe("incoming-2");
  });
});

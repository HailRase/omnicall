import { describe, expect, it } from "vitest";

import type { SdkPublicEventDraft } from "./ExternalSdkEventMapper.js";
import { SdkOperatorEventRevisionGate } from "./SdkOperatorEventRevisionGate.js";
import { SdkSessionRevisionClock } from "./SdkSessionRevisionClock.js";

function statusDraft(
  status: string,
  reasonId?: number,
  reserved?: Readonly<{ target: "ready" | "break"; reasonId: number }>,
): SdkPublicEventDraft {
  return {
    type: "operator:status-changed",
    payload: {
      status,
      ...(reasonId !== undefined ? { reasonId } : {}),
      reasonLabelKey: `ocp.operatorStatus.${status}`,
      ...(reserved !== undefined
        ? {
            reservedTarget: reserved.target,
            reservedReasonId: reserved.reasonId,
          }
        : {}),
    },
  };
}

function sessionDraft(connected: boolean): SdkPublicEventDraft {
  return {
    type: "operator:session-changed",
    payload: { connected },
  };
}

describe("SdkOperatorEventRevisionGate", () => {
  it("advances on ready→break coarse change", () => {
    const clock = new SdkSessionRevisionClock();
    const gate = new SdkOperatorEventRevisionGate();
    expect(clock.peek()).toBe(1);

    const first = gate.preparePublish(statusDraft("ready", 1), clock);
    expect(first.advanced).toBe(true);
    expect(first.revision).toBe(2);

    const second = gate.preparePublish(statusDraft("break", 7), clock);
    expect(second.advanced).toBe(true);
    expect(second.revision).toBe(3);
  });

  it("does not advance talking→hold when both map to unknown", () => {
    const clock = new SdkSessionRevisionClock();
    const gate = new SdkOperatorEventRevisionGate();

    const talking = gate.preparePublish(statusDraft("unknown", 4), clock);
    expect(talking.advanced).toBe(true);
    expect(talking.revision).toBe(2);

    const hold = gate.preparePublish(statusDraft("unknown", 6), clock);
    expect(hold.advanced).toBe(false);
    expect(hold.revision).toBe(2);
    expect(clock.peek()).toBe(2);
  });

  it("advances on break reasonId change while coarse stays break", () => {
    const clock = new SdkSessionRevisionClock();
    const gate = new SdkOperatorEventRevisionGate();

    gate.preparePublish(statusDraft("break", 7), clock);
    expect(clock.peek()).toBe(2);

    const next = gate.preparePublish(statusDraft("break", 11), clock);
    expect(next.advanced).toBe(true);
    expect(next.revision).toBe(3);
  });

  it("advances on session connected flip only", () => {
    const clock = new SdkSessionRevisionClock();
    const gate = new SdkOperatorEventRevisionGate();

    const connected = gate.preparePublish(sessionDraft(true), clock);
    expect(connected.advanced).toBe(true);
    expect(connected.revision).toBe(2);

    const again = gate.preparePublish(sessionDraft(true), clock);
    expect(again.advanced).toBe(false);
    expect(again.revision).toBe(2);

    const ended = gate.preparePublish(sessionDraft(false), clock);
    expect(ended.advanced).toBe(true);
    expect(ended.revision).toBe(3);
  });

  it("does not advance non-operator drafts", () => {
    const clock = new SdkSessionRevisionClock();
    const gate = new SdkOperatorEventRevisionGate();
    const draft: SdkPublicEventDraft = {
      type: "registration:changed",
      payload: { state: "registered" },
    };
    const result = gate.preparePublish(draft, clock);
    expect(result.advanced).toBe(false);
    expect(result.revision).toBe(1);
    expect(clock.peek()).toBe(1);
  });

  it("advances when reservedTarget changes while coarse stays unknown", () => {
    const clock = new SdkSessionRevisionClock();
    const gate = new SdkOperatorEventRevisionGate();

    const talking = gate.preparePublish(statusDraft("unknown", 4), clock);
    expect(talking.advanced).toBe(true);
    expect(talking.revision).toBe(2);

    const reserved = gate.preparePublish(
      statusDraft("unknown", 4, { target: "break", reasonId: 7 }),
      clock,
    );
    expect(reserved.advanced).toBe(true);
    expect(reserved.revision).toBe(3);

    const same = gate.preparePublish(
      statusDraft("unknown", 4, { target: "break", reasonId: 7 }),
      clock,
    );
    expect(same.advanced).toBe(false);
    expect(same.revision).toBe(3);
  });
});

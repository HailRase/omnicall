import { describe, expect, it } from "vitest";

import type { SdkPublicEventDraft } from "./ExternalSdkEventMapper.js";
import { SdkOperatorEventRevisionGate } from "./SdkOperatorEventRevisionGate.js";
import { SdkSessionRevisionCoordinator } from "./SdkSessionRevisionCoordinator.js";

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
  it("advances on ready→break coarse change", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const gate = new SdkOperatorEventRevisionGate();
    expect(coordinator.peek()).toBe(1);

    const first = await gate.preparePublish(statusDraft("ready", 1), coordinator);
    expect(first.advanced).toBe(true);
    expect(first.revision).toBe(2);

    const second = await gate.preparePublish(statusDraft("break", 7), coordinator);
    expect(second.advanced).toBe(true);
    expect(second.revision).toBe(3);
  });

  it("does not advance talking→hold when both map to unknown", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const gate = new SdkOperatorEventRevisionGate();

    const talking = await gate.preparePublish(statusDraft("unknown", 4), coordinator);
    expect(talking.advanced).toBe(true);
    expect(talking.revision).toBe(2);

    const hold = await gate.preparePublish(statusDraft("unknown", 6), coordinator);
    expect(hold.advanced).toBe(false);
    expect(hold.revision).toBe(2);
    expect(coordinator.peek()).toBe(2);
  });

  it("advances on break reasonId change while coarse stays break", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const gate = new SdkOperatorEventRevisionGate();

    await gate.preparePublish(statusDraft("break", 7), coordinator);
    expect(coordinator.peek()).toBe(2);

    const next = await gate.preparePublish(statusDraft("break", 11), coordinator);
    expect(next.advanced).toBe(true);
    expect(next.revision).toBe(3);
  });

  it("advances on session connected flip only", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const gate = new SdkOperatorEventRevisionGate();

    const connected = await gate.preparePublish(sessionDraft(true), coordinator);
    expect(connected.advanced).toBe(true);
    expect(connected.revision).toBe(2);

    const again = await gate.preparePublish(sessionDraft(true), coordinator);
    expect(again.advanced).toBe(false);
    expect(again.revision).toBe(2);

    const ended = await gate.preparePublish(sessionDraft(false), coordinator);
    expect(ended.advanced).toBe(true);
    expect(ended.revision).toBe(3);
  });

  it("does not advance non-operator drafts", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const gate = new SdkOperatorEventRevisionGate();
    const draft: SdkPublicEventDraft = {
      type: "registration:changed",
      payload: { state: "registered" },
    };
    const result = await gate.preparePublish(draft, coordinator);
    expect(result.advanced).toBe(false);
    expect(result.revision).toBe(1);
    expect(coordinator.peek()).toBe(1);
  });

  it("advances when reservedTarget changes while coarse stays unknown", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const gate = new SdkOperatorEventRevisionGate();

    const talking = await gate.preparePublish(statusDraft("unknown", 4), coordinator);
    expect(talking.advanced).toBe(true);
    expect(talking.revision).toBe(2);

    const reserved = await gate.preparePublish(
      statusDraft("unknown", 4, { target: "break", reasonId: 7 }),
      coordinator,
    );
    expect(reserved.advanced).toBe(true);
    expect(reserved.revision).toBe(3);

    const same = await gate.preparePublish(
      statusDraft("unknown", 4, { target: "break", reasonId: 7 }),
      coordinator,
    );
    expect(same.advanced).toBe(false);
    expect(same.revision).toBe(3);
  });
});

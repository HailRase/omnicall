import { describe, expect, it } from "vitest";

import { OperatorStatus } from "./OperatorStatus.js";
import {
  createOperatorProfile,
  withUpdatedStatus,
} from "./OperatorProfile.js";

describe("OperatorProfile", () => {
  it("creates immutable profile snapshot", () => {
    const since = new Date("2026-07-13T10:00:00.000Z");
    const profile = createOperatorProfile({
      operatorId: 42,
      status: OperatorStatus.READY,
      reasonId: 1,
      statusSince: since,
    });

    expect(profile).toEqual({
      operatorId: 42,
      status: OperatorStatus.READY,
      reasonId: 1,
      statusSince: since,
    });
  });

  it("withUpdatedStatus returns a new object without mutating the original", () => {
    const initialSince = new Date("2026-07-13T10:00:00.000Z");
    const profile = createOperatorProfile({
      operatorId: 7,
      status: OperatorStatus.READY,
      reasonId: 1,
      statusSince: initialSince,
    });

    const nextSince = new Date("2026-07-13T10:05:00.000Z");
    const updated = withUpdatedStatus(
      profile,
      OperatorStatus.BREAK,
      7,
      nextSince,
    );

    expect(updated).toEqual({
      operatorId: 7,
      status: OperatorStatus.BREAK,
      reasonId: 7,
      statusSince: nextSince,
    });
    expect(profile.status).toBe(OperatorStatus.READY);
    expect(profile.reasonId).toBe(1);
    expect(profile.statusSince).toBe(initialSince);
    expect(updated).not.toBe(profile);
  });
});

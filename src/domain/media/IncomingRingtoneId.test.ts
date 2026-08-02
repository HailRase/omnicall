import { describe, expect, it } from "vitest";
import {
  DEFAULT_INCOMING_RINGTONE_ID,
  INCOMING_RINGTONE_IDS,
  listIncomingRingtoneIds,
  parseIncomingRingtoneId,
  resolveIncomingRingtoneId,
} from "./IncomingRingtoneId.js";

describe("IncomingRingtoneId", () => {
  it("keeps classic as the default to preserve current ringtone behavior", () => {
    expect(DEFAULT_INCOMING_RINGTONE_ID).toBe("classic");
    expect(INCOMING_RINGTONE_IDS[0]).toBe("classic");
  });

  it("exposes at least ten selectable ringtone presets", () => {
    expect(listIncomingRingtoneIds().length).toBeGreaterThanOrEqual(10);
  });

  it("parses known ids and rejects unknown values", () => {
    expect(parseIncomingRingtoneId("soft-chime")).toBe("soft-chime");
    expect(parseIncomingRingtoneId("iphone")).toBeNull();
    expect(parseIncomingRingtoneId(12)).toBeNull();
  });

  it("resolves missing or unknown ids to classic without failing", () => {
    expect(resolveIncomingRingtoneId(undefined)).toBe("classic");
    expect(resolveIncomingRingtoneId("huawei-official")).toBe("classic");
  });
});

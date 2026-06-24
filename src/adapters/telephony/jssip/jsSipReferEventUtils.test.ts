import { describe, expect, it } from "vitest";
import { buildAttendedReferTarget } from "./buildAttendedReferTarget.js";
import {
  classifyReferNotifyFailure,
  formatReferFailure,
  formatReferRequestFailure,
  mapReferNotifyFailureMessage,
  referNotifyFailureUserMessage,
} from "./jsSipReferEventUtils.js";

describe("buildAttendedReferTarget", () => {
  it("extracts sip URI from angle-bracket remote identity", () => {
    expect(buildAttendedReferTarget('"Agent" <sip:200@dev.example>')).toBe(
      "sip:200@dev.example",
    );
  });

  it("returns bare sip URI unchanged", () => {
    expect(buildAttendedReferTarget("sip:300@dev.example")).toBe("sip:300@dev.example");
  });
});

describe("jsSipReferEventUtils", () => {
  it("formats REFER request failure cause", () => {
    expect(formatReferRequestFailure({ cause: "REJECTED" })).toBe("REJECTED");
  });

  it("formats NOTIFY failure status line", () => {
    expect(
      formatReferFailure({
        status_line: { status_code: 603, reason_phrase: "Decline" },
      }),
    ).toBe("SIP 603 Decline");
  });

  it("classifies NOTIFY 487 as transfer_target_canceled", () => {
    const event = { status_line: { status_code: 487, reason_phrase: "Canceled" } };
    expect(classifyReferNotifyFailure(event)).toBe("transfer_target_canceled");
    expect(referNotifyFailureUserMessage("transfer_target_canceled", event)).toBe(
      "Transfer target canceled or did not answer",
    );
    expect(mapReferNotifyFailureMessage(event)).toBe(
      "Transfer target canceled or did not answer",
    );
  });
});

import { describe, expect, it } from "vitest";
import { parseOpenExternalApplicationWindowPayload } from "./OpenExternalApplicationWindowContract.js";

const validPayload = {
  url: "https://crm.example.test/call/42",
  title: "CRM",
  width: 1100,
  height: 800,
  applicationId: "app-1",
  callId: "call-42",
  raiseOnOpen: true,
  alwaysOnTopDuringCall: false,
  onCallEnded: "leave" as const,
};

describe("parseOpenExternalApplicationWindowPayload", () => {
  it("accepts a bounded HTTPS screen-pop payload", () => {
    expect(parseOpenExternalApplicationWindowPayload(validPayload)).toMatchObject({
      url: "https://crm.example.test/call/42",
      raiseOnOpen: true,
      onCallEnded: "leave",
    });
  });

  it("rejects non-HTTPS and invalid dimensions", () => {
    expect(
      parseOpenExternalApplicationWindowPayload({
        ...validPayload,
        url: "http://example.test",
        width: 1,
      }),
    ).toBeNull();
  });

  it("rejects missing lifecycle fields", () => {
    expect(
      parseOpenExternalApplicationWindowPayload({
        url: "https://crm.example.test/call/42",
        title: "CRM",
        width: 1100,
        height: 800,
        applicationId: "app-1",
        callId: "call-42",
      }),
    ).toBeNull();
  });
});

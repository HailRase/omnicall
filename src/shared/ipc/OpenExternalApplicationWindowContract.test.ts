import { describe, expect, it } from "vitest";
import { parseOpenExternalApplicationWindowPayload } from "./OpenExternalApplicationWindowContract.js";

describe("parseOpenExternalApplicationWindowPayload", () => {
  it("accepts a bounded HTTPS screen-pop payload", () => {
    expect(
      parseOpenExternalApplicationWindowPayload({
        url: "https://crm.example.test/call/42",
        title: "CRM",
        width: 1100,
        height: 800,
        applicationId: "app-1",
        callId: "call-42",
      }),
    ).toMatchObject({ url: "https://crm.example.test/call/42" });
  });

  it("rejects non-HTTPS and invalid dimensions", () => {
    expect(
      parseOpenExternalApplicationWindowPayload({
        url: "http://example.test",
        title: "CRM",
        width: 1,
        height: 800,
        applicationId: "app-1",
        callId: "call-42",
      }),
    ).toBeNull();
  });
});

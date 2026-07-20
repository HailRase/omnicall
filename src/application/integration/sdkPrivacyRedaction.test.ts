import { describe, expect, it } from "vitest";

import {
  redactDisplayNameForSdk,
  redactPhoneForSdk,
} from "./sdkPrivacyRedaction.js";

describe("sdkPrivacyRedaction", () => {
  it("masks phones per ADR-0017 (last 4 digits)", () => {
    expect(redactPhoneForSdk("+15551237890")).toBe("+*******7890");
    expect(redactPhoneForSdk("5551237890")).toBe("******7890");
    expect(redactPhoneForSdk("7890")).toBe("7890");
  });

  it("masks display names per ADR-0017", () => {
    expect(redactDisplayNameForSdk("Alice")).toBe("A***");
    expect(redactDisplayNameForSdk("Ж")).toBe("*");
    expect(redactDisplayNameForSdk("")).toBe("*");
  });
});

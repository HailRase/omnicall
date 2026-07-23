import { describe, expect, it } from "vitest";
import { createPlatformError } from "@shared/errors/index.js";
import {
  createSipNotRegisteredCause,
  isSipNotRegisteredError,
  SIP_NOT_REGISTERED_OUTBOUND_MESSAGE,
  SIP_NOT_REGISTERED_REASON,
} from "./sipOutboundErrors.js";

describe("sipOutboundErrors", () => {
  it("detects sip_not_registered by message and cause", () => {
    expect(
      isSipNotRegisteredError(
        createPlatformError("operation_failed", SIP_NOT_REGISTERED_OUTBOUND_MESSAGE),
      ),
    ).toBe(true);
    expect(
      isSipNotRegisteredError(
        createPlatformError(
          "operation_failed",
          "other",
          createSipNotRegisteredCause(),
        ),
      ),
    ).toBe(true);
    expect(createSipNotRegisteredCause().reason).toBe(SIP_NOT_REGISTERED_REASON);
    expect(
      isSipNotRegisteredError(createPlatformError("operation_failed", "busy")),
    ).toBe(false);
  });
});

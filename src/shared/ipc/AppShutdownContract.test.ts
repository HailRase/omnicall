import { describe, expect, it } from "vitest";
import {
  parseAppShutdownAckPayload,
  parseAppShutdownPayload,
} from "./AppShutdownContract.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("AppShutdownContract", () => {
  it("parses valid shutdown payload", () => {
    const correlationId = createCorrelationId();
    const parsed = parseAppShutdownPayload({
      correlationId,
      source: "before-quit",
    });

    expect(parsed).toEqual({
      correlationId,
      source: "before-quit",
    });
  });

  it("rejects invalid shutdown payload", () => {
    expect(parseAppShutdownPayload(null)).toBeNull();
    expect(parseAppShutdownPayload({ correlationId: "bad", source: "before-quit" })).toBeNull();
    expect(
      parseAppShutdownPayload({
        correlationId: createCorrelationId(),
        source: "invalid",
      }),
    ).toBeNull();
  });

  it("parses shutdown acknowledgement payload", () => {
    const correlationId = createCorrelationId();
    expect(parseAppShutdownAckPayload({ correlationId })).toEqual({ correlationId });
  });
});

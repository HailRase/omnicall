import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "./TestLogger.js";

describe("TestLogger", () => {
  it("captures log entries with context", () => {
    const logger = createTestLogger();
    const correlationId = createCorrelationId();

    logger.info("platform_boot", {
      correlationId,
      featureId: "F-000",
      boundedContext: "Integration",
      operation: "boot",
      result: "started",
    });

    expect(logger.entries).toHaveLength(1);
    expect(logger.entries[0]?.message).toBe("platform_boot");
    expect(logger.entries[0]?.context?.correlationId).toBe(correlationId);
  });

  it("supports child loggers and clear", () => {
    const logger = createTestLogger();
    logger.child({ operation: "child-op" }).warn("child_warn");
    expect(logger.entries).toHaveLength(1);
    logger.clear();
    expect(logger.entries).toHaveLength(0);
  });
});

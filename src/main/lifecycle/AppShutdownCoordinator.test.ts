import { describe, expect, it } from "vitest";
import { AppShutdownCoordinator } from "./AppShutdownCoordinator.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("AppShutdownCoordinator", () => {
  it("starts shutdown once and rejects duplicate begin", () => {
    const coordinator = new AppShutdownCoordinator();
    const correlationId = createCorrelationId();

    expect(coordinator.beginShutdown(correlationId, "quit")).toBe("started");
    expect(coordinator.isBusy()).toBe(true);
    expect(coordinator.beginShutdown(createCorrelationId(), "restart")).toBe(
      "already_in_progress",
    );
  });

  it("completes quit shutdown when ack matches pending request", () => {
    const coordinator = new AppShutdownCoordinator();
    const correlationId = createCorrelationId();

    coordinator.beginShutdown(correlationId, "quit");
    expect(coordinator.completeShutdown(correlationId, "quit")).toBe("quit");
    expect(coordinator.getPhase()).toBe("completing");
  });

  it("completes restart shutdown when ack matches pending request", () => {
    const coordinator = new AppShutdownCoordinator();
    const correlationId = createCorrelationId();

    coordinator.beginShutdown(correlationId, "restart");
    expect(coordinator.completeShutdown(correlationId, "restart")).toBe("restart");
  });

  it("rejects ack with mismatched correlation id or action", () => {
    const coordinator = new AppShutdownCoordinator();
    const correlationId = createCorrelationId();

    coordinator.beginShutdown(correlationId, "quit");
    expect(coordinator.completeShutdown(createCorrelationId(), "quit")).toBe("rejected");
    expect(coordinator.completeShutdown(correlationId, "restart")).toBe("rejected");
  });

  it("resets pending shutdown when cleanup is cancelled", () => {
    const coordinator = new AppShutdownCoordinator();
    const correlationId = createCorrelationId();

    coordinator.beginShutdown(correlationId, "quit");
    expect(coordinator.cancelShutdown(correlationId, "quit")).toBe("cancelled");
    expect(coordinator.getPhase()).toBe("idle");
    expect(coordinator.isBusy()).toBe(false);
  });

  it("allows retry after reset and then completes", () => {
    const coordinator = new AppShutdownCoordinator();
    const firstCorrelationId = createCorrelationId();
    const secondCorrelationId = createCorrelationId();

    coordinator.beginShutdown(firstCorrelationId, "restart");
    expect(coordinator.cancelShutdown(firstCorrelationId, "restart")).toBe("cancelled");
    expect(coordinator.beginShutdown(secondCorrelationId, "restart")).toBe("started");
    expect(coordinator.completeShutdown(secondCorrelationId, "restart")).toBe("restart");
  });
});

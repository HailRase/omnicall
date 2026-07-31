import { describe, expect, it } from "vitest";
import { MockOutboundHttpAdapter } from "./MockOutboundHttpAdapter.js";
import {
  OUTBOUND_HTTP_TIMEOUT_MS,
  type OutboundHttpRequest,
} from "@ports/integration/OutboundHttpPort.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

const request: OutboundHttpRequest = {
  method: "POST",
  url: "https://example.test/webhook",
  headers: [],
  body: "{\"event\":\"test\"}",
  timeoutMs: OUTBOUND_HTTP_TIMEOUT_MS,
  correlationId: "corr_external_services_test" as CorrelationId,
};

describe("MockOutboundHttpAdapter", () => {
  it("captures scripted transport outcomes", async () => {
    const adapter = new MockOutboundHttpAdapter();
    adapter.enqueueResult({
      kind: "network_error",
      code: "timeout",
      durationMs: 10_000,
      message: "Timed out.",
    });

    await expect(adapter.execute(request)).resolves.toEqual({
      kind: "network_error",
      code: "timeout",
      durationMs: 10_000,
      message: "Timed out.",
    });
    expect(adapter.getInvocations()).toEqual([request]);
  });

  it("holds deferred invocations and observes concurrency", async () => {
    const adapter = new MockOutboundHttpAdapter();
    adapter.enqueueDeferred();
    adapter.enqueueDeferred();

    const first = adapter.execute(request);
    const second = adapter.execute({ ...request, url: "https://example.test/second" });
    const deferred = adapter.getDeferredInvocations();

    expect(adapter.getMaxObservedConcurrency()).toBe(2);
    expect(deferred).toHaveLength(2);

    deferred[0]?.resolve({
      kind: "response",
      status: 200,
      durationMs: 1,
      body: "first",
    });
    deferred[1]?.resolve({
      kind: "response",
      status: 500,
      durationMs: 2,
      body: "second",
    });

    await expect(first).resolves.toMatchObject({ kind: "response", status: 200 });
    await expect(second).resolves.toMatchObject({ kind: "response", status: 500 });
  });
});

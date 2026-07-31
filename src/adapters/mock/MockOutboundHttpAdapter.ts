/**
 * - Purpose: script deterministic outbound HTTP outcomes for application tests.
 * - Inputs: queued response, network-error, or deferred transport outcomes.
 * - Outputs: captured invocations and observed concurrent execution count.
 */
import type {
  OutboundHttpPort,
  OutboundHttpRequest,
  OutboundHttpResult,
} from "@ports/integration/OutboundHttpPort.js";

export type DeferredOutboundHttpInvocation = Readonly<{
  request: OutboundHttpRequest;
  resolve: (result: OutboundHttpResult) => void;
  reject: (error: Error) => void;
}>;

type ScriptedOutcome =
  | Readonly<{ kind: "result"; result: OutboundHttpResult }>
  | Readonly<{ kind: "deferred" }>;

function copyRequest(request: OutboundHttpRequest): OutboundHttpRequest {
  return {
    ...request,
    headers: request.headers.map((header) => ({ ...header })),
  };
}

export class MockOutboundHttpAdapter implements OutboundHttpPort {
  private readonly outcomes: ScriptedOutcome[] = [];
  private readonly invocations: OutboundHttpRequest[] = [];
  private readonly deferredInvocations: DeferredOutboundHttpInvocation[] = [];
  private activeInvocations = 0;
  private maxObservedConcurrency = 0;

  enqueueResult(result: OutboundHttpResult): void {
    this.outcomes.push({ kind: "result", result });
  }

  enqueueDeferred(): void {
    this.outcomes.push({ kind: "deferred" });
  }

  execute(request: OutboundHttpRequest): Promise<OutboundHttpResult> {
    const capturedRequest = copyRequest(request);
    this.invocations.push(capturedRequest);
    this.activeInvocations += 1;
    this.maxObservedConcurrency = Math.max(
      this.maxObservedConcurrency,
      this.activeInvocations,
    );

    const outcome = this.outcomes.shift();
    if (outcome?.kind === "result") {
      this.completeInvocation();
      return Promise.resolve(outcome.result);
    }

    if (outcome?.kind === "deferred") {
      return new Promise<OutboundHttpResult>((resolve, reject) => {
        let settled = false;
        const settle = (callback: () => void): void => {
          if (settled) {
            return;
          }
          settled = true;
          this.completeInvocation();
          callback();
        };
        this.deferredInvocations.push({
          request: capturedRequest,
          resolve: (result) => {
            settle(() => resolve(result));
          },
          reject: (error) => {
            settle(() => reject(error));
          },
        });
      });
    }

    this.completeInvocation();
    return Promise.resolve({
      kind: "network_error",
      code: "unknown",
      durationMs: 0,
      message: "No outbound HTTP mock outcome was scripted.",
    });
  }

  getInvocations(): ReadonlyArray<OutboundHttpRequest> {
    return this.invocations.map(copyRequest);
  }

  getDeferredInvocations(): ReadonlyArray<DeferredOutboundHttpInvocation> {
    return [...this.deferredInvocations];
  }

  getMaxObservedConcurrency(): number {
    return this.maxObservedConcurrency;
  }

  private completeInvocation(): void {
    this.activeInvocations -= 1;
  }
}

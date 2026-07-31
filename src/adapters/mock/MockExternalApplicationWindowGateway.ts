/**
 * - Purpose: record External Application window requests in tests.
 * - Inputs: application screen-pop and call-ended commands.
 * - Outputs: configurable successful or failed result.
 */

import type {
  ApplyExternalApplicationCallEndedPayload,
  ApplyExternalApplicationCallEndedResult,
  ExternalApplicationWindowGateway,
  OpenExternalApplicationWindowPayload,
  OpenExternalApplicationWindowResult,
} from "@ports/integration/ExternalApplicationWindowGateway.js";

export class MockExternalApplicationWindowGateway
  implements ExternalApplicationWindowGateway
{
  readonly requests: OpenExternalApplicationWindowPayload[] = [];
  readonly callEndedRequests: ApplyExternalApplicationCallEndedPayload[] = [];

  constructor(
    private readonly result: OpenExternalApplicationWindowResult = {
      ok: true,
      focusedExisting: false,
    },
  ) {}

  openWindow(
    payload: OpenExternalApplicationWindowPayload,
  ): Promise<OpenExternalApplicationWindowResult> {
    this.requests.push(payload);
    return Promise.resolve(this.result);
  }

  applyCallEndedLifecycle(
    payload: ApplyExternalApplicationCallEndedPayload,
  ): Promise<ApplyExternalApplicationCallEndedResult> {
    this.callEndedRequests.push(payload);
    return Promise.resolve({ ok: true, affected: 0 });
  }
}

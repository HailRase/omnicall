/**
 * - Purpose: record External Application window requests in tests.
 * - Inputs: application screen-pop commands.
 * - Outputs: configurable successful or failed result.
 */
import type {
  ExternalApplicationWindowGateway,
  OpenExternalApplicationWindowPayload,
  OpenExternalApplicationWindowResult,
} from "@ports/integration/ExternalApplicationWindowGateway.js";

export class MockExternalApplicationWindowGateway
  implements ExternalApplicationWindowGateway
{
  readonly requests: OpenExternalApplicationWindowPayload[] = [];

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
}

import type { ExternalUrlGateway } from "@ports/updates/ExternalUrlGateway.js";
import { ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

/**
 * - Purpose: capture opened URLs in application tests (F-020).
 * - Inputs: URL open commands.
 * - Outputs: success Result and recorded URL list.
 */
export class MockExternalUrlGateway implements ExternalUrlGateway {
  public openedUrls: string[] = [];

  openUrl(url: string): Promise<Result<void, PlatformError>> {
    this.openedUrls.push(url);
    return Promise.resolve(ok(undefined));
  }
}

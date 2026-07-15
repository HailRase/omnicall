/**
 * - Purpose: in-memory OCP HTTP authenticate port for Use Case / Facade tests.
 * - Inputs: domain/login/apiKey; optional scripted outcomes.
 * - Outputs: token | session_exist | configured PlatformError.
 */

import type {
  OcpProxyAuthenticateInput,
  OcpProxyAuthenticateOutcome,
  OcpProxyAuthenticatePort,
} from "@ports/integration/OcpProxyAuthenticatePort.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

export type MockOcpProxyAuthenticateBehavior =
  | Readonly<{ kind: "token"; token: string }>
  | Readonly<{ kind: "session_exist" }>
  | Readonly<{ kind: "error"; error: PlatformError }>;

export class MockOcpProxyAuthenticatePort implements OcpProxyAuthenticatePort {
  private behavior: MockOcpProxyAuthenticateBehavior = {
    kind: "token",
    token: "mock-softphone-auth-token",
  };
  readonly calls: OcpProxyAuthenticateInput[] = [];

  setBehavior(behavior: MockOcpProxyAuthenticateBehavior): void {
    this.behavior = behavior;
  }

  authenticate(
    input: OcpProxyAuthenticateInput,
  ): Promise<Result<OcpProxyAuthenticateOutcome, PlatformError>> {
    this.calls.push(input);
    const { domain, login, apiKey } = input;
    if (domain.trim().length === 0) {
      return Promise.resolve(
        err(
          createPlatformError("validation_failed", "domain_required", {
            reason: "domain_required",
          }),
        ),
      );
    }
    if (login.trim().length === 0) {
      return Promise.resolve(
        err(
          createPlatformError("validation_failed", "login_required", {
            reason: "login_required",
          }),
        ),
      );
    }
    if (apiKey.trim().length === 0) {
      return Promise.resolve(
        err(
          createPlatformError("validation_failed", "api_key_required", {
            reason: "api_key_required",
          }),
        ),
      );
    }

    if (this.behavior.kind === "error") {
      return Promise.resolve(err(this.behavior.error));
    }
    if (this.behavior.kind === "session_exist") {
      return Promise.resolve(ok({ kind: "session_exist" }));
    }
    return Promise.resolve(ok({ kind: "token", token: this.behavior.token }));
  }
}

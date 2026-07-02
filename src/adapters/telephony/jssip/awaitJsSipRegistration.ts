import { mapSipRegistrationFailureFromParts } from "@domain/index.js";
import type { JsSipUaPort } from "./JsSipUaPort.js";
import { extractJsSipRegistrationFailureParts } from "./extractJsSipRegistrationFailureParts.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

const DEFAULT_REGISTRATION_TIMEOUT_MS = 30_000;

const TRANSIENT_REGISTRATION_CAUSES: ReadonlySet<string> = new Set([
  "Connection Error",
]);

export type AwaitJsSipRegistrationOptions = Readonly<{
  ua: JsSipUaPort;
  username: string;
  registrationTimeoutMs?: number;
}>;

/**
 * - Purpose: await JsSIP UA registration, tolerating transient transport retries.
 * - Inputs: UA port, account username, optional timeout.
 * - Outputs: registration success or normalized platform error.
 */
export function awaitJsSipRegistration(
  options: AwaitJsSipRegistrationOptions,
): Promise<Result<void, PlatformError>> {
  const { ua, username } = options;
  const registrationTimeoutMs =
    options.registrationTimeoutMs ?? DEFAULT_REGISTRATION_TIMEOUT_MS;

  return new Promise((resolve) => {
    let settled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const settle = (result: Result<void, PlatformError>): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(result);
    };

    const onRegistered = (): void => {
      settle(ok(undefined));
    };

    const onFailed = (...args: unknown[]): void => {
      if (ua.isRegistered()) {
        settle(ok(undefined));
        return;
      }

      const failure = extractJsSipRegistrationFailureParts(args[0]);
      if (isTransientRegistrationFailure(failure.cause)) {
        return;
      }

      const reasonKey = mapSipRegistrationFailureFromParts(
        failure.cause,
        failure.statusCode,
      );

      settle(
        err(
          createPlatformError(
            "operation_failed",
            `SIP registration failed for ${username}: ${formatRegistrationFailureMessage(failure, reasonKey)}`,
          ),
        ),
      );
    };

    const onTimeout = (): void => {
      if (ua.isRegistered()) {
        settle(ok(undefined));
        return;
      }

      settle(
        err(
          createPlatformError(
            "operation_failed",
            `SIP registration failed for ${username}: registration_timeout`,
          ),
        ),
      );
    };

    const cleanup = (): void => {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
      ua.off("registered", onRegistered);
      ua.off("registrationFailed", onFailed);
    };

    ua.on("registered", onRegistered);
    ua.on("registrationFailed", onFailed);
    timeoutHandle = setTimeout(onTimeout, registrationTimeoutMs);
    ua.register();
  });
}

function isTransientRegistrationFailure(cause: string): boolean {
  return TRANSIENT_REGISTRATION_CAUSES.has(cause);
}

function formatRegistrationFailureMessage(
  failure: ReturnType<typeof extractJsSipRegistrationFailureParts>,
  reasonKey: string,
): string {
  if (failure.statusCode !== null) {
    return `${failure.statusCode} ${failure.cause} (${reasonKey})`;
  }

  return `${failure.cause} (${reasonKey})`;
}

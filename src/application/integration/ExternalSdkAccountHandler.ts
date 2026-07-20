/**
 * Application account-activate handler (DI-08 / ADR-0013 §B).
 * Capability + local approval gated in main; this maps wire → Facade sign-in.
 */

import type { CommandMessage } from "@axatalk/protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@axatalk/protocol";
import type {
  ExternalCommandContext,
  ExternalCommandHandler,
  ExternalHandlerResult,
} from "@ports/integration/ExternalCommandHandler.js";
import {
  ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE,
} from "@application/facades/accountSignInCommand.js";

import type { ExternalSdkAccountPort } from "./ExternalSdkAccountPort.js";
import {
  readExpectedRevision,
  readStringField,
  sdkCallStale,
  sdkCallSuccess,
  sdkFail,
} from "./externalSdkCallHelpers.js";
import { mapPlatformErrorToSdkCode } from "./mapPlatformErrorToSdkCode.js";
import { SdkAggregateMutex } from "./SdkAggregateMutex.js";
import type { SdkSessionRevisionClock } from "./SdkSessionRevisionClock.js";
import { assertClientId } from "./externalSdkOperatorHelpers.js";

const ACTIVATE_COMMAND = "account:activate-profile" as const;
const ACCOUNT_LOCK_KEY = "__sdk_account__";
const IDEMPOTENCY_TTL_MS = 120_000;

export type ExternalSdkAccountHandlerOptions = Readonly<{
  accountPort: ExternalSdkAccountPort;
  revisionClock: SdkSessionRevisionClock;
  mutex?: SdkAggregateMutex;
  nowMs?: () => number;
}>;

type CachedReply = Readonly<{
  result: ExternalHandlerResult;
  expiresAt: number;
}>;

/**
 * Focused saved-profile activation surface for the single renderer composition.
 */
export class ExternalSdkAccountHandler implements ExternalCommandHandler {
  private readonly accountPort: ExternalSdkAccountPort;
  private readonly revisionClock: SdkSessionRevisionClock;
  private readonly mutex: SdkAggregateMutex;
  private readonly nowMs: () => number;
  private readonly idempotency = new Map<string, CachedReply>();
  private readonly inFlight = new Map<string, Promise<ExternalHandlerResult>>();

  constructor(options: ExternalSdkAccountHandlerOptions) {
    this.accountPort = options.accountPort;
    this.revisionClock = options.revisionClock;
    this.mutex = options.mutex ?? new SdkAggregateMutex();
    this.nowMs = options.nowMs ?? (() => Date.now());
  }

  handlesCommandType(commandType: string): boolean {
    return commandType === ACTIVATE_COMMAND;
  }

  handleCommand(
    input: unknown,
    context?: ExternalCommandContext,
  ): Promise<ExternalHandlerResult> {
    const validated = validateWireMessage(input);
    if (!validated.success) {
      return Promise.resolve(sdkFail(validated.code));
    }
    const message = validated.data;
    if (message.kind !== "command") {
      return Promise.resolve(sdkFail("invalid_message"));
    }
    if (!isCommandAvailableInProductV1(message.type)) {
      const denial = productDenialCodeForCommand(message.type);
      return Promise.resolve(sdkFail(denial ?? "forbidden"));
    }
    if (!this.handlesCommandType(message.type)) {
      return Promise.resolve(sdkFail("unsupported_command"));
    }

    const requestId = message.requestId;
    this.pruneCaches();
    const cached = this.idempotency.get(requestId);
    if (cached !== undefined && cached.expiresAt > this.nowMs()) {
      return Promise.resolve(cached.result);
    }
    const pending = this.inFlight.get(requestId);
    if (pending !== undefined) {
      return pending;
    }

    const execution = this.executeCommand(message, context).then((result) => {
      this.idempotency.set(requestId, {
        result,
        expiresAt: this.nowMs() + IDEMPOTENCY_TTL_MS,
      });
      this.inFlight.delete(requestId);
      return result;
    });
    this.inFlight.set(requestId, execution);
    return execution;
  }

  private executeCommand(
    message: CommandMessage,
    context: ExternalCommandContext | undefined,
  ): Promise<ExternalHandlerResult> {
    const clientId = context?.clientId;
    const clientGate = assertClientId(clientId);
    if (clientGate !== null || clientId === undefined) {
      return Promise.resolve(clientGate ?? sdkFail("unauthenticated"));
    }
    return this.mutex.runExclusive(ACCOUNT_LOCK_KEY, () =>
      this.handleActivate(message.payload),
    );
  }

  private async handleActivate(
    payload: unknown,
  ): Promise<ExternalHandlerResult> {
    const expectedRevision = readExpectedRevision(payload);
    if (expectedRevision === null) {
      return sdkFail("invalid_payload");
    }
    const current = this.revisionClock.peek();
    if (expectedRevision !== current) {
      return sdkCallStale(current);
    }

    const profileRef = readStringField(payload, "profileRef");
    if (profileRef === null || profileRef.trim().length === 0) {
      return sdkFail("invalid_payload");
    }

    const result = await this.accountPort.activateSavedProfile(profileRef);
    if (!result.ok) {
      return mapActivateError(result.error);
    }

    const revision = this.revisionClock.advance();
    return sdkCallSuccess(
      {
        activated: true,
        mode: result.value.mode,
        ...(result.value.profileLabel !== undefined
          ? { profileLabel: result.value.profileLabel }
          : {}),
      },
      revision,
    );
  }

  private pruneCaches(): void {
    const now = this.nowMs();
    for (const [key, entry] of this.idempotency) {
      if (entry.expiresAt <= now) {
        this.idempotency.delete(key);
      }
    }
  }
}

function mapActivateError(
  error: Parameters<typeof mapPlatformErrorToSdkCode>[0],
): ExternalHandlerResult {
  if (error.message === ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE) {
    return sdkFail("conflict");
  }
  return {
    ok: false,
    code: mapPlatformErrorToSdkCode(error),
    retryable: false,
  };
}

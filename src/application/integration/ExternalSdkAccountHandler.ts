/**
 * Application account-activate handler (login path / ADR-0013 §B / ADR-0018 §E).
 * Capability + Origin matrix gated in main; consent modal for activate / reauthorize.
 */

import type { CommandMessage } from "@softomnitel/omnicall-protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@softomnitel/omnicall-protocol";
import type {
  ExternalCommandContext,
  ExternalCommandHandler,
  ExternalHandlerResult,
} from "@ports/integration/ExternalCommandHandler.js";
import {
  sdkAccountLoginsMatch,
  trimSdkAccountLogin,
} from "@shared/integration/sdkAccountLogin.js";

import type {
  ExternalSdkAccountPort,
  SdkActivateMode,
} from "./ExternalSdkAccountPort.js";
import type { SdkActivateConsentPort } from "./SdkActivateConsentPort.js";
import {
  activateSavedProfileWithAuthBudget,
  consentTimeoutFailure,
  mapActivateError,
} from "./externalSdkAccountActivateHelpers.js";
import {
  readExpectedRevision,
  readStringField,
  sdkCallStale,
  sdkCallSuccess,
  sdkFail,
} from "./externalSdkCallHelpers.js";
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
  consentPort?: SdkActivateConsentPort;
  isConsentPending?: () => boolean;
  onActivateConsentDenied?: (origin: string) => void | Promise<void>;
}>;

type CachedReply = Readonly<{
  result: ExternalHandlerResult;
  expiresAt: number;
}>;

/**
 * Login-based saved-profile activation for the single renderer composition.
 */
export class ExternalSdkAccountHandler implements ExternalCommandHandler {
  private readonly accountPort: ExternalSdkAccountPort;
  private readonly revisionClock: SdkSessionRevisionClock;
  private readonly mutex: SdkAggregateMutex;
  private readonly nowMs: () => number;
  private readonly consentPort: SdkActivateConsentPort | undefined;
  private readonly isConsentPending: (() => boolean) | undefined;
  private readonly onActivateConsentDenied:
    | ((origin: string) => void | Promise<void>)
    | undefined;
  private readonly idempotency = new Map<string, CachedReply>();
  private readonly inFlight = new Map<string, Promise<ExternalHandlerResult>>();
  private readonly lastAuthorizedClientByOrigin = new Map<string, string>();

  constructor(options: ExternalSdkAccountHandlerOptions) {
    this.accountPort = options.accountPort;
    this.revisionClock = options.revisionClock;
    this.mutex = options.mutex ?? new SdkAggregateMutex();
    this.nowMs = options.nowMs ?? (() => Date.now());
    this.consentPort = options.consentPort;
    this.isConsentPending = options.isConsentPending;
    this.onActivateConsentDenied = options.onActivateConsentDenied;
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
      this.handleActivate(message.payload, context?.origin, clientId),
    );
  }

  private async handleActivate(
    payload: unknown,
    origin: string | undefined,
    clientId: string,
  ): Promise<ExternalHandlerResult> {
    const expectedRevision = readExpectedRevision(payload);
    if (expectedRevision === null) {
      return sdkFail("invalid_payload");
    }
    const current = this.revisionClock.peek();
    if (expectedRevision !== current) {
      return sdkCallStale(current);
    }

    const loginRaw = readStringField(payload, "login");
    if (loginRaw === null || trimSdkAccountLogin(loginRaw).length === 0) {
      return sdkFail("invalid_payload");
    }
    const login = trimSdkAccountLogin(loginRaw);
    const preferredMode = readOptionalMode(payload);

    if (this.isConsentPending?.() === true) {
      return sdkFail("conflict", { activate_consent_pending: true });
    }

    const lookup = await this.accountPort.lookupSavedProfileByLogin(login);
    if (!lookup.ok) {
      return mapActivateError(lookup.error);
    }

    const availableModes =
      preferredMode !== null &&
      lookup.value.availableModes.includes(preferredMode)
        ? ([preferredMode] as const)
        : lookup.value.availableModes;
    if (availableModes.length === 0) {
      return sdkFail("not_found", { account_incomplete: true });
    }

    const session = this.accountPort.getActivateSessionView();
    const sameLogin =
      session.signedIn &&
      session.currentLogin !== null &&
      sdkAccountLoginsMatch(login, session.currentLogin);

    if (session.signedIn && !sameLogin) {
      this.consentPort?.notifyLogoutRequired?.({
        origin: origin ?? "",
        login,
        profileLabel: lookup.value.profileLabel,
        currentProfileLabel: session.profileLabel,
      });
      return sdkFail("conflict", { logout_required: true });
    }

    if (sameLogin) {
      return this.handleSameLoginActivate({
        clientId,
        origin,
        login,
        preferredMode,
        availableModes,
        profileLabel: lookup.value.profileLabel,
        sessionMode: session.currentMode,
      });
    }

    if (this.consentPort !== undefined) {
      if (origin === undefined || origin.trim().length === 0) {
        return sdkFail("forbidden", { permission_denied: true });
      }
      const decision = await this.consentPort.requestConsent({
        kind: "activate",
        origin,
        login,
        profileLabel: lookup.value.profileLabel,
        availableModes,
        ...(preferredMode !== null ? { preferredMode } : {}),
      });
      const consentGate = await this.mapConsentDecision(decision, origin);
      if (consentGate !== null) {
        return consentGate;
      }
      if (decision.decision !== "allow") {
        return sdkFail("forbidden", { permission_denied: true });
      }
      return this.completeActivation(login, decision.mode, origin, clientId);
    }

    const mode = preferredMode ?? availableModes[0]!;
    return this.completeActivation(login, mode, origin ?? "", clientId);
  }

  private async handleSameLoginActivate(input: {
    readonly clientId: string;
    readonly origin: string | undefined;
    readonly login: string;
    readonly preferredMode: SdkActivateMode | null;
    readonly availableModes: readonly SdkActivateMode[];
    readonly profileLabel: string;
    readonly sessionMode: SdkActivateMode | null;
  }): Promise<ExternalHandlerResult> {
    const lastClientId = this.lastAuthorizedClientByOrigin.get(
      input.origin ?? "",
    );
    if (lastClientId === input.clientId) {
      const revision = this.revisionClock.peek();
      return sdkCallSuccess(
        {
          activated: true,
          alreadyAuthenticated: true,
          mode: input.sessionMode ?? input.availableModes[0]!,
          ...(input.profileLabel.length > 0
            ? { profileLabel: input.profileLabel }
            : {}),
        },
        revision,
      );
    }
    if (this.consentPort === undefined || input.origin === undefined) {
      return sdkFail("forbidden", { permission_denied: true });
    }
    const decision = await this.consentPort.requestConsent({
      kind: "reauthorize",
      origin: input.origin,
      login: input.login,
      profileLabel: input.profileLabel,
      availableModes: input.availableModes,
      ...(input.preferredMode !== null
        ? { preferredMode: input.preferredMode }
        : {}),
    });
    const consentGate = await this.mapConsentDecision(decision, input.origin);
    if (consentGate !== null) {
      return consentGate;
    }
    if (decision.decision !== "allow") {
      return sdkFail("forbidden", { permission_denied: true });
    }
    this.lastAuthorizedClientByOrigin.set(input.origin, input.clientId);
    const revision = this.revisionClock.peek();
    return sdkCallSuccess(
      {
        activated: true,
        alreadyAuthenticated: true,
        mode: decision.mode,
        ...(input.profileLabel.length > 0
          ? { profileLabel: input.profileLabel }
          : {}),
      },
      revision,
    );
  }

  private async mapConsentDecision(
    decision: Awaited<ReturnType<SdkActivateConsentPort["requestConsent"]>>,
    origin: string,
  ): Promise<ExternalHandlerResult | null> {
    if (decision.decision === "timeout") {
      return consentTimeoutFailure();
    }
    if (decision.decision === "deny") {
      await this.onActivateConsentDenied?.(origin);
      return sdkFail("forbidden", {
        permission_denied: true,
        activate_denied_for_origin: true,
      });
    }
    if (decision.decision === "dismiss") {
      return sdkFail("forbidden", {
        permission_denied: true,
        authorization_canceled_by_user: true,
      });
    }
    return null;
  }

  private async completeActivation(
    login: string,
    mode: SdkActivateMode,
    origin: string,
    clientId: string,
  ): Promise<ExternalHandlerResult> {
    const result = await activateSavedProfileWithAuthBudget(
      this.accountPort,
      login,
      mode,
    );
    if (!result.ok) {
      return mapActivateError(result.error, {
        activatePhase: "sign_in",
        authMode: mode,
      });
    }
    this.lastAuthorizedClientByOrigin.set(origin, clientId);
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

function readOptionalMode(payload: unknown): SdkActivateMode | null {
  const raw = readStringField(payload, "mode");
  if (raw === "sip_only" || raw === "ocp") {
    return raw;
  }
  return null;
}

/**
 * Application account-activate handler (login path / ADR-0013 §B / ADR-0018 §E / ADR-0027).
 * Capability + Origin matrix gated in main; consent modal for activate / reauthorize.
 * Aggregate revision via SdkSessionRevisionCoordinator.
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
  sdkFail,
} from "./externalSdkCallHelpers.js";
import { assertClientId } from "./externalSdkOperatorHelpers.js";
import type {
  SdkRevisionMutationOutcome,
  SdkSessionRevisionCoordinator,
} from "./SdkSessionRevisionCoordinator.js";

const ACTIVATE_COMMAND = "account:activate-profile" as const;
const IDEMPOTENCY_TTL_MS = 120_000;

export type ExternalSdkAccountHandlerOptions = Readonly<{
  accountPort: ExternalSdkAccountPort;
  revisionCoordinator: SdkSessionRevisionCoordinator;
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
  private readonly revisionCoordinator: SdkSessionRevisionCoordinator;
  private readonly nowMs: () => number;
  private readonly consentPort: SdkActivateConsentPort | undefined;
  private readonly isConsentPending: (() => boolean) | undefined;
  private readonly onActivateConsentDenied:
    | ((origin: string) => void | Promise<void>)
    | undefined;
  private readonly idempotency = new Map<string, CachedReply>();
  private readonly inFlight = new Map<string, Promise<ExternalHandlerResult>>();
  private readonly lastAuthorizedClientByOrigin = new Map<string, string>();
  private readonly activationControllers = new Map<string, Set<AbortController>>();

  constructor(options: ExternalSdkAccountHandlerOptions) {
    this.accountPort = options.accountPort;
    this.revisionCoordinator = options.revisionCoordinator;
    this.nowMs = options.nowMs ?? (() => Date.now());
    this.consentPort = options.consentPort;
    this.isConsentPending = options.isConsentPending;
    this.onActivateConsentDenied = options.onActivateConsentDenied;
  }

  handlesCommandType(commandType: string): boolean {
    return commandType === ACTIVATE_COMMAND;
  }

  /**
   * Cancels activation work owned by the exact authenticated SDK identity.
   */
  abortClientSession(origin: string, clientId: string): number {
    const key = this.clientIdentityKey(origin, clientId);
    const controllers = this.activationControllers.get(key);
    if (controllers === undefined) {
      return 0;
    }
    for (const controller of controllers) {
      controller.abort();
    }
    return controllers.size;
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

    const requestId = this.idempotencyKey(message.requestId, context);
    this.pruneCaches();
    const cached = this.idempotency.get(requestId);
    if (cached !== undefined && cached.expiresAt > this.nowMs()) {
      return Promise.resolve(cached.result);
    }
    const pending = this.inFlight.get(requestId);
    if (pending !== undefined) {
      return pending;
    }

    const execution = this.executeCommand(message, context)
      .then((result) => {
        this.idempotency.set(requestId, {
          result,
          expiresAt: this.nowMs() + IDEMPOTENCY_TTL_MS,
        });
        return result;
      })
      .finally(() => {
        this.inFlight.delete(requestId);
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
    const expectedRevision = readExpectedRevision(message.payload);
    if (expectedRevision === null) {
      return Promise.resolve(sdkFail("invalid_payload"));
    }
    if (isSignalAborted(context?.signal)) {
      return Promise.resolve(sdkFail("operation_failed"));
    }
    const origin = context?.origin ?? "";
    const activation = this.createActivationSignal(origin, clientId, context?.signal);
    return this.reserveAndActivate(
      expectedRevision,
      message.payload,
      origin,
      clientId,
      activation.signal,
    ).finally(activation.dispose);
  }

  private async reserveAndActivate(
    expectedRevision: number,
    payload: unknown,
    origin: string | undefined,
    clientId: string,
    signal: AbortSignal | undefined,
  ): Promise<ExternalHandlerResult> {
    const reservation =
      await this.revisionCoordinator.reserveMutation(expectedRevision);
    if ("ok" in reservation) {
      return reservation;
    }
    try {
      // Consent and authentication can wait on UI/network; neither retains the
      // aggregate mutex. The reservation makes final revision validation explicit.
      const outcome = await this.handleActivate(payload, origin, clientId, signal);
      if (!outcome.ok) {
        await this.revisionCoordinator.cancelReservation(reservation);
        return outcome;
      }
      return this.revisionCoordinator.commitReservation(
        reservation,
        () =>
          Promise.resolve(
            isSignalAborted(signal) ? sdkFail("operation_failed") : outcome,
          ),
      );
    } catch (error: unknown) {
      await this.revisionCoordinator.cancelReservation(reservation);
      throw error;
    }
  }

  private async handleActivate(
    payload: unknown,
    origin: string | undefined,
    clientId: string,
    signal: AbortSignal | undefined,
  ): Promise<SdkRevisionMutationOutcome> {
    if (isSignalAborted(signal)) {
      return sdkFail("operation_failed");
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
    if (isSignalAborted(signal)) {
      return sdkFail("operation_failed");
    }
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
        signal,
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
      if (isSignalAborted(signal)) {
        return sdkFail("operation_failed");
      }
      const consentGate = await this.mapConsentDecision(decision, origin);
      if (consentGate !== null) {
        return consentGate;
      }
      if (decision.decision === "allow") {
        return this.completeActivation(login, decision.mode, origin, clientId, signal);
      }
      return sdkFail("forbidden", { permission_denied: true });
    }

    const mode = preferredMode ?? availableModes[0]!;
    return this.completeActivation(login, mode, origin ?? "", clientId, signal);
  }

  private async handleSameLoginActivate(input: {
    readonly clientId: string;
    readonly origin: string | undefined;
    readonly login: string;
    readonly preferredMode: SdkActivateMode | null;
    readonly availableModes: readonly SdkActivateMode[];
    readonly profileLabel: string;
    readonly sessionMode: SdkActivateMode | null;
    readonly signal: AbortSignal | undefined;
  }): Promise<SdkRevisionMutationOutcome> {
    const lastClientId = this.lastAuthorizedClientByOrigin.get(
      input.origin ?? "",
    );
    if (lastClientId === input.clientId) {
      return {
        ok: true,
        advance: false,
        result: {
          activated: true,
          alreadyAuthenticated: true,
          mode: input.sessionMode ?? input.availableModes[0]!,
          ...(input.profileLabel.length > 0
            ? { profileLabel: input.profileLabel }
            : {}),
        },
      };
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
    if (isSignalAborted(input.signal)) {
      return sdkFail("operation_failed");
    }
    const consentGate = await this.mapConsentDecision(decision, input.origin);
    if (consentGate !== null) {
      return consentGate;
    }
    if (decision.decision !== "allow") {
      return sdkFail("forbidden", { permission_denied: true });
    }
    this.lastAuthorizedClientByOrigin.set(input.origin, input.clientId);
    return {
      ok: true,
      advance: false,
      result: {
        activated: true,
        alreadyAuthenticated: true,
        mode: decision.mode,
        ...(input.profileLabel.length > 0
          ? { profileLabel: input.profileLabel }
          : {}),
      },
    };
  }

  private async mapConsentDecision(
    decision: Awaited<ReturnType<SdkActivateConsentPort["requestConsent"]>>,
    origin: string,
  ): Promise<SdkRevisionMutationOutcome | null> {
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
    signal: AbortSignal | undefined,
  ): Promise<SdkRevisionMutationOutcome> {
    if (isSignalAborted(signal)) {
      return sdkFail("operation_failed");
    }
    const result = await this.awaitAuthentication(login, mode, signal);
    if (isSignalAborted(signal)) {
      return sdkFail("operation_failed");
    }
    if (!result.ok) {
      return mapActivateError(result.error, {
        activatePhase: "sign_in",
        authMode: mode,
      });
    }
    this.lastAuthorizedClientByOrigin.set(origin, clientId);
    return {
      ok: true,
      result: {
        activated: true,
        mode: result.value.mode,
        ...(result.value.profileLabel !== undefined
          ? { profileLabel: result.value.profileLabel }
          : {}),
      },
    };
  }

  private pruneCaches(): void {
    const now = this.nowMs();
    for (const [key, entry] of this.idempotency) {
      if (entry.expiresAt <= now) {
        this.idempotency.delete(key);
      }
    }
  }

  private idempotencyKey(
    requestId: string,
    context: ExternalCommandContext | undefined,
  ): string {
    return `${context?.origin ?? ""}\u0000${context?.clientId ?? ""}\u0000${requestId}`;
  }

  private createActivationSignal(
    origin: string,
    clientId: string,
    parentSignal: AbortSignal | undefined,
  ): Readonly<{ signal: AbortSignal; dispose: () => void }> {
    const controller = new AbortController();
    const key = this.clientIdentityKey(origin, clientId);
    const controllers = this.activationControllers.get(key) ?? new Set<AbortController>();
    controllers.add(controller);
    this.activationControllers.set(key, controllers);
    const abortFromParent = (): void => controller.abort();
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });
    if (parentSignal?.aborted === true) {
      controller.abort();
    }
    return {
      signal: controller.signal,
      dispose: () => {
        parentSignal?.removeEventListener("abort", abortFromParent);
        controllers.delete(controller);
        if (controllers.size === 0) {
          this.activationControllers.delete(key);
        }
      },
    };
  }

  private async awaitAuthentication(
    login: string,
    mode: SdkActivateMode,
    signal: AbortSignal | undefined,
  ): Promise<Awaited<ReturnType<typeof activateSavedProfileWithAuthBudget>>> {
    if (signal === undefined) {
      return activateSavedProfileWithAuthBudget(this.accountPort, login, mode);
    }
    return new Promise((resolve) => {
      const onAbort = (): void => {
        void Promise.resolve(this.accountPort.cancelInFlightActivateSignIn?.(mode));
        resolve({
          ok: false,
          error: {
            code: "operation_failed",
            message: "sdk_activate_canceled",
          },
        });
      };
      signal.addEventListener("abort", onAbort, { once: true });
      void activateSavedProfileWithAuthBudget(this.accountPort, login, mode).then(
        (result) => {
          signal.removeEventListener("abort", onAbort);
          resolve(result);
        },
      );
    });
  }

  private clientIdentityKey(origin: string, clientId: string): string {
    return `${origin}\u0000${clientId}`;
  }
}

function readOptionalMode(payload: unknown): SdkActivateMode | null {
  const raw = readStringField(payload, "mode");
  if (raw === "sip_only" || raw === "ocp") {
    return raw;
  }
  return null;
}

function isSignalAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

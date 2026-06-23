import type { DomainEvent } from "@domain/index.js";
import type { SipAccountInput } from "@domain/index.js";
import type { PhoneStatus } from "@domain/index.js";
import { isErr } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";import { InMemoryDomainEventBus } from "../events/InMemoryDomainEventBus.js";
import { AuthenticateOcpUseCase } from "../use-cases/AuthenticateOcpUseCase.js";
import { AuthorizeSipAccountUseCase } from "../use-cases/AuthorizeSipAccountUseCase.js";
import { RegisterAccountUseCase } from "../use-cases/RegisterAccountUseCase.js";
import type {
  DomainEventPublisher,
  Logger,
  OperatorPlatformGateway,
  SettingsRepository,
  TelephonyGateway,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
export type AccountBootstrapFacadeDeps = Readonly<{
  operatorGateway: OperatorPlatformGateway;
  telephonyGateway: TelephonyGateway;
  settingsRepository: SettingsRepository;
  logger: Logger;
  eventPublisher?: DomainEventPublisher;
}>;

export class AccountBootstrapFacade {
  readonly eventPublisher: DomainEventPublisher;
  readonly authenticateOcp: AuthenticateOcpUseCase;
  readonly authorizeSipAccount: AuthorizeSipAccountUseCase;
  readonly registerAccount: RegisterAccountUseCase;

  private readonly processedCredentialEvents = new Set<string>();

  constructor(private readonly deps: AccountBootstrapFacadeDeps) {
    this.eventPublisher = deps.eventPublisher ?? new InMemoryDomainEventBus();
    this.authenticateOcp = new AuthenticateOcpUseCase(
      deps.operatorGateway,
      this.eventPublisher,
      deps.logger,
    );
    this.authorizeSipAccount = new AuthorizeSipAccountUseCase(
      deps.settingsRepository,
      this.eventPublisher,
      deps.logger,
    );
    this.registerAccount = new RegisterAccountUseCase(
      deps.telephonyGateway,
      this.eventPublisher,
      deps.logger,
    );

    this.eventPublisher.subscribe((event) => {
      void this.handleAutoRegistration(event);
    });
  }

  async initialize(): Promise<void> {
    const config = await this.deps.settingsRepository.getBootstrapConfig();
    const phoneStatus = await this.deps.settingsRepository.getPhoneStatus();

    if (config.mode === "ocp" && config.ocpToken && config.ocpDomain) {
      await this.authenticateOcp.execute({
        token: config.ocpToken,
        domain: config.ocpDomain,
      });
      return;
    }

    const existingAccount = await this.deps.settingsRepository.getSipAccount();
    if (existingAccount !== null && phoneStatus !== "offline") {
      await this.registerAccount.execute({ account: existingAccount });
    }
  }

  async authorizeManualAccount(
    account: SipAccountInput,
    correlationId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const authorizeInput =
      correlationId === undefined
        ? { account, source: "manual" as const }
        : { account, correlationId, source: "manual" as const };

    const authorizeResult = await this.authorizeSipAccount.execute(authorizeInput);

    if (isErr(authorizeResult)) {
      return authorizeResult;
    }

    const registerInput =
      correlationId === undefined
        ? { account: authorizeResult.value }
        : { account: authorizeResult.value, correlationId };

    return this.registerAccount.execute(registerInput);
  }

  async setPhoneStatus(status: PhoneStatus): Promise<void> {
    await this.deps.settingsRepository.setPhoneStatus(status);
  }

  private async handleAutoRegistration(event: DomainEvent): Promise<void> {
    if (event.type !== "SipCredentialsReceived") {
      return;
    }

    const source = event["source"];
    if (source !== "ocp") {
      return;
    }

    if (this.processedCredentialEvents.has(event.correlationId)) {
      return;
    }

    this.processedCredentialEvents.add(event.correlationId);

    const credentials = event["credentials"];
    if (!isSipAccountInput(credentials)) {
      return;
    }

    await this.authorizeManualAccount(credentials, event.correlationId);
  }
}

function isSipAccountInput(value: unknown): value is SipAccountInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["uri"] === "string" &&
    typeof candidate["username"] === "string" &&
    typeof candidate["password"] === "string" &&
    typeof candidate["displayName"] === "string" &&
    typeof candidate["registrar"] === "string"
  );
}

/**
 * - Purpose: compose External Applications runtime for bootstrap and tests.
 * - Inputs: window gateway, external URL gateway, clock, UUID, logger, settings repo.
 * - Outputs: event entry, manual open, save, and lifecycle controls.
 */

import type {
  Clock,
  Logger,
  SettingsRepository,
  UuidGenerator,
} from "@ports/index.js";
import type { ExternalApplicationWindowGateway } from "@ports/integration/ExternalApplicationWindowGateway.js";
import type { ExternalUrlGateway } from "@ports/updates/ExternalUrlGateway.js";
import type {
  ExternalApplicationsSettings,
  SettingsAccountKey,
} from "@domain/index.js";
import type { DomainEvent } from "@domain/shared/DomainEvent.js";
import {
  OpenExternalApplicationNowUseCase,
  type OpenExternalApplicationNowInput,
} from "../../../use-cases/integration/OpenExternalApplicationNowUseCase.js";
import {
  SaveExternalApplicationsSettingsUseCase,
  type SaveExternalApplicationsSettingsInput,
} from "../../../use-cases/integration/SaveExternalApplicationsSettingsUseCase.js";
import { ExternalApplicationsAutomationService } from "./ExternalApplicationsAutomationService.js";
import { ExternalApplicationsDelayScheduler } from "./ExternalApplicationsDelayScheduler.js";
import type { ExternalApplicationDispatchJob } from "./ExternalApplicationDispatchJob.js";
import type { ExternalServicesProductSnapshot } from "../external-services/ExternalServicesProductSnapshot.js";
import { ExternalApplicationsRuntimeRegistry } from "./ExternalApplicationsRuntimeRegistry.js";
import { executeExternalApplicationJob } from "./executeExternalApplicationJob.js";

export type ExternalApplicationsCompositionDeps = Readonly<{
  windowGateway: ExternalApplicationWindowGateway;
  externalUrlGateway: ExternalUrlGateway;
  clock: Clock;
  uuidGenerator: UuidGenerator;
  logger: Logger;
  settingsRepository?: SettingsRepository;
}>;

export class ExternalApplicationsComposition {
  readonly registry: ExternalApplicationsRuntimeRegistry;
  readonly scheduler: ExternalApplicationsDelayScheduler;
  readonly automation: ExternalApplicationsAutomationService;
  readonly openNow: OpenExternalApplicationNowUseCase;
  readonly saveSettings: SaveExternalApplicationsSettingsUseCase | null;
  private readonly pending = new Set<Promise<void>>();

  constructor(deps: ExternalApplicationsCompositionDeps) {
    this.registry = new ExternalApplicationsRuntimeRegistry();
    this.scheduler = new ExternalApplicationsDelayScheduler({
      clock: deps.clock,
      registry: this.registry,
      enqueue: (job) => this.enqueue(job, deps),
      logger: deps.logger,
    });
    this.automation = new ExternalApplicationsAutomationService({
      registry: this.registry,
      scheduler: this.scheduler,
      uuidGenerator: deps.uuidGenerator,
      logger: deps.logger,
    });
    this.openNow = new OpenExternalApplicationNowUseCase({
      registry: this.registry,
      enqueue: (job) => this.enqueue(job, deps),
      uuidGenerator: deps.uuidGenerator,
      logger: deps.logger,
    });
    this.saveSettings =
      deps.settingsRepository === undefined
        ? null
        : new SaveExternalApplicationsSettingsUseCase({
            settingsRepository: deps.settingsRepository,
            registry: this.registry,
            logger: deps.logger,
          });
  }

  handleCommittedEvent(
    event: DomainEvent,
    snapshot: ExternalServicesProductSnapshot,
  ): void {
    this.automation.handleCommittedEvent(event, snapshot);
  }

  activateProfile(
    profileKey: SettingsAccountKey,
    settings: ExternalApplicationsSettings,
  ): void {
    this.scheduler.cancelWhere(() => true);
    this.registry.activateProfile(profileKey, settings);
  }

  replaceActiveSettings(settings: ExternalApplicationsSettings): void {
    this.scheduler.cancelWhere(() => true);
    this.registry.replaceSettings(settings);
  }

  invalidateLifecycle(): void {
    this.scheduler.cancelWhere(() => true);
    this.registry.invalidateLifecycle();
  }

  dispose(): void {
    this.scheduler.dispose();
    this.registry.invalidateLifecycle();
  }

  async saveExternalApplicationsSettings(
    input: SaveExternalApplicationsSettingsInput,
  ) {
    if (this.saveSettings === null) {
      throw new Error("external_applications_save_unavailable");
    }
    return this.saveSettings.execute(input);
  }

  openExternalApplicationNow(input: OpenExternalApplicationNowInput) {
    return this.openNow.execute(input);
  }

  private enqueue(
    job: ExternalApplicationDispatchJob,
    deps: ExternalApplicationsCompositionDeps,
  ): void {
    const task = executeExternalApplicationJob(job, {
      registry: this.registry,
      windowGateway: deps.windowGateway,
      externalUrlGateway: deps.externalUrlGateway,
      logger: deps.logger,
    }).finally(() => {
      this.pending.delete(task);
    });
    this.pending.add(task);
  }
}

export function createExternalApplicationsComposition(
  deps: ExternalApplicationsCompositionDeps,
): ExternalApplicationsComposition {
  return new ExternalApplicationsComposition(deps);
}

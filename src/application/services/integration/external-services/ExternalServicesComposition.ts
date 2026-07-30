/**
 * - Purpose: compose External Services runtime for bootstrap and focused tests.
 * - Inputs: outbound HTTP, journal, clock, UUID, logger, and optional settings repository.
 * - Outputs: synthetic event entry, manual Run now, save/query/import/export, and lifecycle controls.
 */

import type {
  Clock,
  Logger,
  OutboundHttpPort,
  SettingsRepository,
  UuidGenerator,
} from "@ports/index.js";
import type { ExternalServicesJournalRepository } from "@ports/integration/ExternalServicesJournalRepository.js";
import type {
  ExternalServicesSettings,
  SettingsAccountKey,
} from "@domain/index.js";
import type { DomainEvent } from "@domain/shared/DomainEvent.js";
import { ExecuteExternalServiceRequestUseCase } from "../../../use-cases/integration/ExecuteExternalServiceRequestUseCase.js";
import {
  ExportExternalServiceCollectionUseCase,
  type ExportExternalServiceCollectionInput,
} from "../../../use-cases/integration/ExportExternalServiceCollectionUseCase.js";
import {
  ImportExternalServiceCollectionUseCase,
  type ImportExternalServiceCollectionInput,
} from "../../../use-cases/integration/ImportExternalServiceCollectionUseCase.js";
import {
  QueryExternalServicesUseCase,
  type QueryExternalServicesInput,
} from "../../../use-cases/integration/QueryExternalServicesUseCase.js";
import {
  RunExternalServiceRequestNowUseCase,
  type RunExternalServiceRequestNowInput,
} from "../../../use-cases/integration/RunExternalServiceRequestNowUseCase.js";
import {
  SaveExternalServicesSettingsUseCase,
  type SaveExternalServicesSettingsInput,
} from "../../../use-cases/integration/SaveExternalServicesSettingsUseCase.js";
import { ExternalServicesAutomationService } from "./ExternalServicesAutomationService.js";
import { ExternalServicesDispatchQueue } from "./ExternalServicesDispatchQueue.js";
import { ExternalServicesDelayScheduler } from "./ExternalServicesDelayScheduler.js";
import type { ExternalServiceExecutionResult } from "./ExternalServiceExecutionResult.js";
import type { ExternalServicesWaitingJob } from "./ExternalServicesDelayScheduler.js";
import type { ExternalServicesProductSnapshot } from "./ExternalServicesProductSnapshot.js";
import { ExternalServicesRuntimeRegistry } from "./ExternalServicesRuntimeRegistry.js";

export type ExternalServicesCompositionDeps = Readonly<{
  outboundHttp: OutboundHttpPort;
  journalRepository: ExternalServicesJournalRepository;
  clock: Clock;
  uuidGenerator: UuidGenerator;
  logger: Logger;
  settingsRepository?: SettingsRepository;
}>;

export class ExternalServicesComposition {
  readonly registry: ExternalServicesRuntimeRegistry;
  readonly queue: ExternalServicesDispatchQueue;
  readonly scheduler: ExternalServicesDelayScheduler;
  readonly automation: ExternalServicesAutomationService;
  readonly runNow: RunExternalServiceRequestNowUseCase;
  readonly saveSettings: SaveExternalServicesSettingsUseCase | null;
  readonly query: QueryExternalServicesUseCase | null;
  readonly exportCollection: ExportExternalServiceCollectionUseCase | null;
  readonly importCollection: ImportExternalServiceCollectionUseCase | null;
  private readonly executeUseCase: ExecuteExternalServiceRequestUseCase;

  constructor(deps: ExternalServicesCompositionDeps) {
    this.registry = new ExternalServicesRuntimeRegistry();
    this.executeUseCase = new ExecuteExternalServiceRequestUseCase({
      outboundHttp: deps.outboundHttp,
      journalRepository: deps.journalRepository,
      clock: deps.clock,
      uuidGenerator: deps.uuidGenerator,
      logger: deps.logger,
    });
    this.queue = new ExternalServicesDispatchQueue({
      registry: this.registry,
      executeJob: async (job) => {
        const result = await this.executeUseCase.execute(job);
        if (job.resolveManual !== null) {
          job.resolveManual(result);
        }
      },
      logger: deps.logger,
    });
    this.scheduler = new ExternalServicesDelayScheduler({
      clock: deps.clock,
      registry: this.registry,
      enqueue: (job) => this.queue.enqueue(job),
      logger: deps.logger,
    });
    this.automation = new ExternalServicesAutomationService({
      registry: this.registry,
      queue: this.queue,
      scheduler: this.scheduler,
      uuidGenerator: deps.uuidGenerator,
      logger: deps.logger,
    });
    this.runNow = new RunExternalServiceRequestNowUseCase({
      registry: this.registry,
      queue: this.queue,
      uuidGenerator: deps.uuidGenerator,
      logger: deps.logger,
    });
    this.saveSettings =
      deps.settingsRepository === undefined
        ? null
        : new SaveExternalServicesSettingsUseCase({
            settingsRepository: deps.settingsRepository,
            registry: this.registry,
            logger: deps.logger,
          });
    this.query =
      deps.settingsRepository === undefined
        ? null
        : new QueryExternalServicesUseCase({
            settingsRepository: deps.settingsRepository,
            journalRepository: deps.journalRepository,
            registry: this.registry,
          });
    this.exportCollection =
      deps.settingsRepository === undefined
        ? null
        : new ExportExternalServiceCollectionUseCase({
            settingsRepository: deps.settingsRepository,
            registry: this.registry,
            logger: deps.logger,
            clock: deps.clock,
          });
    this.importCollection =
      deps.settingsRepository === undefined
        ? null
        : new ImportExternalServiceCollectionUseCase({
            settingsRepository: deps.settingsRepository,
            registry: this.registry,
            uuidGenerator: deps.uuidGenerator,
            logger: deps.logger,
          });
  }

  activateProfile(
    profileKey: SettingsAccountKey,
    settings: ExternalServicesSettings,
    settingsRevision = 1,
  ): void {
    this.registry.activateProfile(profileKey, settings, settingsRevision);
    const generation = this.registry.getSnapshot().lifecycleGeneration;
    this.queue.dropPendingWhere(
      (job) => job.lifecycleGeneration !== generation,
    );
    this.scheduler.cancelWhere((job) => job.lifecycleGeneration !== generation);
  }

  replaceActiveSettings(settings: ExternalServicesSettings): void {
    this.registry.replaceSettings(settings);
    const revision = this.registry.getSnapshot().settingsRevision;
    this.queue.dropPendingWhere((job) => job.settingsRevision !== revision);
    this.scheduler.cancelWhere((job) => job.settingsRevision !== revision);
  }

  invalidateLifecycle(): void {
    this.registry.invalidateLifecycle();
    this.queue.dropPendingWhere(() => true);
    this.scheduler.cancelWhere(() => true);
  }

  handleCommittedEvent(
    event: DomainEvent,
    snapshot: ExternalServicesProductSnapshot,
  ): void {
    this.automation.handleCommittedEvent(event, snapshot);
  }

  runExternalServiceRequestNow(
    input: RunExternalServiceRequestNowInput,
  ): Promise<ExternalServiceExecutionResult> {
    return this.runNow.execute(input);
  }

  async saveExternalServicesSettings(input: SaveExternalServicesSettingsInput) {
    if (this.saveSettings === null) {
      return Promise.reject(new Error("external_services_settings_unavailable"));
    }
    const result = await this.saveSettings.execute(input);
    if (result.ok) {
      const revision = result.value.settingsRevision;
      this.queue.dropPendingWhere((job) => job.settingsRevision !== revision);
      this.scheduler.cancelWhere((job) => job.settingsRevision !== revision);
    }
    return result;
  }

  queryExternalServices(input: QueryExternalServicesInput) {
    if (this.query === null) {
      return Promise.reject(new Error("external_services_query_unavailable"));
    }
    return this.query.execute(input);
  }

  getWaitingJobs(): ReadonlyArray<ExternalServicesWaitingJob> {
    return this.scheduler.getWaiting();
  }

  cancelExternalServiceQueuedJob(jobId: string): boolean {
    return this.scheduler.cancel(jobId);
  }

  exportExternalServiceCollection(input: ExportExternalServiceCollectionInput) {
    if (this.exportCollection === null) {
      return Promise.reject(new Error("external_services_export_unavailable"));
    }
    return this.exportCollection.execute(input);
  }

  async importExternalServiceCollection(input: ImportExternalServiceCollectionInput) {
    if (this.importCollection === null) {
      return Promise.reject(new Error("external_services_import_unavailable"));
    }
    const result = await this.importCollection.execute(input);
    if (result.ok) {
      const revision = this.registry.getSnapshot().settingsRevision;
      this.queue.dropPendingWhere((job) => job.settingsRevision !== revision);
      this.scheduler.cancelWhere((job) => job.settingsRevision !== revision);
    }
    return result;
  }

  dispose(): void {
    this.scheduler.dispose();
    this.queue.dispose();
  }
}

export function createExternalServicesComposition(
  deps: ExternalServicesCompositionDeps,
): ExternalServicesComposition {
  return new ExternalServicesComposition(deps);
}

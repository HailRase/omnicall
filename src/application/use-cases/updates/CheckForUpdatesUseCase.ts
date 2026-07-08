import { evaluateUpdateAvailability } from "@domain/updates/evaluateUpdateAvailability.js";
import type { UpdateManifest } from "@domain/updates/UpdateManifest.js";
import type { ExternalUrlGateway } from "@ports/updates/ExternalUrlGateway.js";
import type { PlatformInfoGateway } from "@ports/updates/PlatformInfoGateway.js";
import type { UpdateMetadataGateway } from "@ports/updates/UpdateMetadataGateway.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

const FEATURE_ID = "F-020";

export type UpdateCheckStatus =
  | "idle"
  | "checking"
  | "updateAvailable"
  | "upToDate"
  | "unavailable"
  | "invalidManifest"
  | "error";

export type UpdateCheckSnapshot = Readonly<{
  status: UpdateCheckStatus;
  currentVersion: string;
  latestVersion?: string;
  downloadUrl?: string;
  releaseDate?: string;
  releaseNotesUrl?: string;
  reason?: string;
}>;

export type CheckForUpdatesInput = Readonly<{
  manifestUrl: string | null;
  correlationId?: CorrelationId;
}>;

export type OpenUpdateDownloadPageInput = Readonly<{
  downloadUrl: string;
  correlationId?: CorrelationId;
}>;

function snapshotFromAvailability(
  status: Exclude<UpdateCheckStatus, "idle" | "checking" | "unavailable" | "error">,
  currentVersion: string,
  availability: ReturnType<typeof evaluateUpdateAvailability>,
): UpdateCheckSnapshot {
  return {
    status,
    currentVersion,
    latestVersion: availability.latestVersion,
    downloadUrl: availability.downloadUrl,
    ...(availability.releaseDate !== undefined ? { releaseDate: availability.releaseDate } : {}),
    ...(availability.releaseNotesUrl !== undefined
      ? { releaseNotesUrl: availability.releaseNotesUrl }
      : {}),
  };
}

/**
 * - Purpose: manual in-app update check without auto-install (F-020).
 * - Inputs: manifest URL, metadata/platform/external URL gateways.
 * - Outputs: update check snapshot and optional open-download command.
 */
export class CheckForUpdatesUseCase {
  constructor(
    private readonly updateMetadataGateway: UpdateMetadataGateway,
    private readonly platformInfoGateway: PlatformInfoGateway,
    private readonly externalUrlGateway: ExternalUrlGateway,
    private readonly logger: Logger,
  ) {}

  async execute(input: CheckForUpdatesInput): Promise<Result<UpdateCheckSnapshot, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    const platformInfoResult = await this.platformInfoGateway.getInstalledPlatformInfo();
    if (!platformInfoResult.ok) {
      this.logger.error("update_check_failed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Integration",
        operation: "check_for_updates",
        result: "error",
        reason: platformInfoResult.error.message,
      });
      return err(platformInfoResult.error);
    }

    const platformInfo = platformInfoResult.value;

    if (input.manifestUrl === null || input.manifestUrl.trim().length === 0) {
      this.logger.info("update_check_unavailable", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Integration",
        operation: "check_for_updates",
        result: "unavailable",
        reason: "manifest_url_missing",
        currentVersion: platformInfo.version,
      });

      return ok({
        status: "unavailable",
        currentVersion: platformInfo.version,
        reason: "manifest_url_missing",
      });
    }

    const manifestUrl = input.manifestUrl.trim();

    this.logger.info("update_check_started", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Integration",
      operation: "check_for_updates",
      currentVersion: platformInfo.version,
      platform: platformInfo.platform,
      result: "started",
    });

    const manifestResult = await this.updateMetadataGateway.fetchManifest(manifestUrl);
    if (!manifestResult.ok) {
      const reason = manifestResult.error.code === "validation_failed"
        ? "invalid_manifest"
        : "network_error";

      this.logger.error("update_check_failed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Integration",
        operation: "check_for_updates",
        result: reason,
        reason: manifestResult.error.message,
      });

      if (manifestResult.error.code === "validation_failed") {
        return ok({
          status: "invalidManifest",
          currentVersion: platformInfo.version,
          reason: manifestResult.error.message,
        });
      }

      return ok({
        status: "error",
        currentVersion: platformInfo.version,
        reason: manifestResult.error.message,
      });
    }

    return this.evaluateManifest(platformInfo.version, manifestResult.value, correlationId);
  }

  async openDownloadPage(
    input: OpenUpdateDownloadPageInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    const openResult = await this.externalUrlGateway.openUrl(input.downloadUrl);
    if (!openResult.ok) {
      this.logger.error("update_download_open_failed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Integration",
        operation: "open_update_download_page",
        result: "error",
        reason: openResult.error.message,
      });
      return err(openResult.error);
    }

    this.logger.info("update_download_opened", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Integration",
      operation: "open_update_download_page",
      result: "opened",
    });

    return ok(undefined);
  }

  private evaluateManifest(
    currentVersion: string,
    manifest: UpdateManifest,
    correlationId: CorrelationId,
  ): Result<UpdateCheckSnapshot, PlatformError> {
    const availability = evaluateUpdateAvailability(currentVersion, manifest);

    if (availability.status === "invalidCurrentVersion" || availability.status === "invalidManifestVersion") {
      this.logger.error("update_check_invalid_version", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Integration",
        operation: "check_for_updates",
        result: "invalid_manifest",
        currentVersion,
        latestVersion: availability.latestVersion,
      });

      return ok({
        status: "invalidManifest",
        currentVersion,
        latestVersion: availability.latestVersion,
        downloadUrl: availability.downloadUrl,
        reason: availability.status,
      });
    }

    const status = availability.status === "updateAvailable" ? "updateAvailable" : "upToDate";
    this.logger.info("update_check_completed", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Integration",
      operation: "check_for_updates",
      result: status,
      currentVersion,
      latestVersion: availability.latestVersion,
    });

    return ok(snapshotFromAvailability(status, currentVersion, availability));
  }
}

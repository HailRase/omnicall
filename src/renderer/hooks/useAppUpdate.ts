import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckForUpdatesUseCase } from "@application/use-cases/CheckForUpdatesUseCase.js";
import type { UpdateCheckSnapshot } from "@application/use-cases/CheckForUpdatesUseCase.js";
import {
  FetchUpdateMetadataAdapter,
  localStorageUpdateBannerDismissStore,
  PreloadExternalUrlGateway,
  PreloadPlatformInfoGateway,
} from "@adapters/index.js";
import type { UpdateBannerDismissStore } from "@ports/index.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { readUpdateManifestUrl } from "../bootstrap/readUpdateManifestUrl.js";
import { resolveUpdateCheckMessage } from "../helpers/resolveUpdateCheckMessage.js";
import { useI18n } from "../i18n/index.js";

const INITIAL_SNAPSHOT: UpdateCheckSnapshot = {
  status: "idle",
  currentVersion: "…",
};

let backgroundUpdateCheckStarted = false;

export type UseAppUpdateOptions = Readonly<{
  manifestUrlOverride?: string | null;
  backgroundCheckOnMount?: boolean;
  dismissedUpdateBannerVersion?: string | null;
  onDismissUpdateBannerVersion?: (latestVersion: string) => void;
  updateBannerDismissStore?: UpdateBannerDismissStore;
}>;

export type UseAppUpdateResult = Readonly<{
  snapshot: UpdateCheckSnapshot;
  statusMessage: string;
  canCheckForUpdates: boolean;
  canOpenDownloadPage: boolean;
  canOpenReleaseNotes: boolean;
  isChecking: boolean;
  showUpdatePrompt: boolean;
  onCheckForUpdates: () => void;
  onOpenDownloadPage: () => void;
  onOpenReleaseNotes: () => void;
  onDismissUpdatePrompt: () => void;
}>;

/** @internal Resets module-level startup guard for unit tests. */
export function resetAppUpdateBackgroundCheckGuardForTests(): void {
  backgroundUpdateCheckStarted = false;
}

function mergeUpdateAvailableSnapshot(
  previous: UpdateCheckSnapshot,
  next: UpdateCheckSnapshot,
): UpdateCheckSnapshot {
  return {
    ...previous,
    status: next.status,
    currentVersion: next.currentVersion,
    ...(next.latestVersion !== undefined ? { latestVersion: next.latestVersion } : {}),
    ...(next.downloadUrl !== undefined ? { downloadUrl: next.downloadUrl } : {}),
    ...(next.releaseDate !== undefined ? { releaseDate: next.releaseDate } : {}),
    ...(next.releaseNotesUrl !== undefined ? { releaseNotesUrl: next.releaseNotesUrl } : {}),
  };
}

/**
 * - Purpose: bind manual and startup update checks to settings and shell UI (F-020).
 * - Inputs: optional manifest URL override, background check flag, dismissed version persistence.
 * - Outputs: update snapshot, localized status, prompt visibility, and action callbacks.
 */
export function useAppUpdate(options: UseAppUpdateOptions = {}): UseAppUpdateResult {
  const { t } = useI18n();
  const manifestUrl = options.manifestUrlOverride ?? readUpdateManifestUrl();
  const backgroundCheckOnMount = options.backgroundCheckOnMount === true;
  const dismissedUpdateBannerVersion = options.dismissedUpdateBannerVersion ?? null;
  const onDismissUpdateBannerVersion = options.onDismissUpdateBannerVersion;
  const updateBannerDismissStore =
    options.updateBannerDismissStore ?? localStorageUpdateBannerDismissStore;
  const useCaseRef = useRef<CheckForUpdatesUseCase | null>(null);
  const [snapshot, setSnapshot] = useState<UpdateCheckSnapshot>(INITIAL_SNAPSHOT);
  const [backgroundUpdateAvailable, setBackgroundUpdateAvailable] = useState(false);

  const useCase = useMemo(() => {
    if (useCaseRef.current === null) {
      useCaseRef.current = new CheckForUpdatesUseCase(
        new FetchUpdateMetadataAdapter(),
        new PreloadPlatformInfoGateway(),
        new PreloadExternalUrlGateway(),
        createTestLogger({ featureId: "F-020", boundedContext: "Integration" }),
      );
    }

    return useCaseRef.current;
  }, []);

  const loadInstalledVersion = useCallback((): void => {
    void useCase
      .execute({ manifestUrl: null })
      .then((result) => {
        if (!result.ok) {
          return;
        }

        setSnapshot((previous) => ({
          ...previous,
          currentVersion: result.value.currentVersion,
        }));
      })
      .catch(() => {
        // Never crash UI on version preload failure.
      });
  }, [useCase]);

  useEffect(() => {
    loadInstalledVersion();
  }, [loadInstalledVersion]);

  useEffect(() => {
    if (!backgroundCheckOnMount) {
      return;
    }

    if (manifestUrl === null || manifestUrl.trim().length === 0) {
      return;
    }

    if (backgroundUpdateCheckStarted) {
      return;
    }

    backgroundUpdateCheckStarted = true;

    void useCase
      .execute({ manifestUrl })
      .then((result) => {
        if (!result.ok) {
          return;
        }

        if (result.value.status === "updateAvailable") {
          setBackgroundUpdateAvailable(true);
          setSnapshot((previous) => mergeUpdateAvailableSnapshot(previous, result.value));
          return;
        }

        setSnapshot((previous) => ({
          ...previous,
          currentVersion: result.value.currentVersion,
        }));
      })
      .catch(() => {
        // Background check failures stay silent; manual check remains available.
      });
  }, [backgroundCheckOnMount, manifestUrl, useCase]);

  const onCheckForUpdates = useCallback((): void => {
    setSnapshot((previous) => ({
      ...previous,
      status: "checking",
    }));

    void useCase
      .execute({ manifestUrl })
      .then((result) => {
        if (!result.ok) {
          setSnapshot((previous) => ({
            ...previous,
            status: "error",
            reason: result.error.message,
          }));
          return;
        }

        setSnapshot(result.value);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : t("updates.status.error");
        setSnapshot((previous) => ({
          ...previous,
          status: "error",
          reason: message,
        }));
      });
  }, [manifestUrl, t, useCase]);

  const dismissUpdatePrompt = useCallback((): void => {
    const latestVersion = snapshot.latestVersion;
    if (latestVersion === undefined) {
      return;
    }

    updateBannerDismissStore.writeDismissedVersion(latestVersion);
    onDismissUpdateBannerVersion?.(latestVersion);
    setBackgroundUpdateAvailable(false);
  }, [onDismissUpdateBannerVersion, snapshot.latestVersion, updateBannerDismissStore]);

  const onOpenDownloadPage = useCallback((): void => {
    if (snapshot.downloadUrl === undefined) {
      return;
    }

    void useCase.openDownloadPage({ downloadUrl: snapshot.downloadUrl }).catch(() => {
      // Errors are logged in the use case; UI keeps last snapshot.
    });
    dismissUpdatePrompt();
  }, [dismissUpdatePrompt, snapshot.downloadUrl, useCase]);

  const onOpenReleaseNotes = useCallback((): void => {
    if (snapshot.releaseNotesUrl === undefined) {
      return;
    }

    void useCase.openDownloadPage({ downloadUrl: snapshot.releaseNotesUrl }).catch(() => {
      // Errors are logged in the use case; UI keeps last snapshot.
    });
  }, [snapshot.releaseNotesUrl, useCase]);

  const onDismissUpdatePrompt = dismissUpdatePrompt;

  const canCheckForUpdates = manifestUrl !== null && snapshot.status !== "checking";
  const canOpenDownloadPage =
    snapshot.status === "updateAvailable" && snapshot.downloadUrl !== undefined;
  const canOpenReleaseNotes = snapshot.releaseNotesUrl !== undefined;
  const isChecking = snapshot.status === "checking";
  const persistedDismissedVersion = updateBannerDismissStore.readDismissedVersion();
  const effectiveDismissedVersion =
    dismissedUpdateBannerVersion ?? persistedDismissedVersion;
  const isDismissedForLatestVersion =
    snapshot.latestVersion !== undefined &&
    effectiveDismissedVersion === snapshot.latestVersion;
  const showUpdatePrompt = backgroundUpdateAvailable && !isDismissedForLatestVersion;
  const statusMessage = resolveUpdateCheckMessage({
    status: snapshot.status,
    latestVersion: snapshot.latestVersion,
    t,
  });

  return {
    snapshot,
    statusMessage,
    canCheckForUpdates,
    canOpenDownloadPage,
    canOpenReleaseNotes,
    isChecking,
    showUpdatePrompt,
    onCheckForUpdates,
    onOpenDownloadPage,
    onOpenReleaseNotes,
    onDismissUpdatePrompt,
  };
}

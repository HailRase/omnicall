import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckForUpdatesUseCase } from "@application/use-cases/CheckForUpdatesUseCase.js";
import type { UpdateCheckSnapshot } from "@application/use-cases/CheckForUpdatesUseCase.js";
import {
  FetchUpdateMetadataAdapter,
  PreloadExternalUrlGateway,
  PreloadPlatformInfoGateway,
} from "@adapters/index.js";
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

/**
 * - Purpose: bind manual and startup update checks to settings and shell UI (F-020).
 * - Inputs: optional manifest URL override and background check flag for tests.
 * - Outputs: update snapshot, localized status, prompt visibility, and action callbacks.
 */
export function useAppUpdate(options: UseAppUpdateOptions = {}): UseAppUpdateResult {
  const { t } = useI18n();
  const manifestUrl = options.manifestUrlOverride ?? readUpdateManifestUrl();
  const backgroundCheckOnMount = options.backgroundCheckOnMount === true;
  const useCaseRef = useRef<CheckForUpdatesUseCase | null>(null);
  const [snapshot, setSnapshot] = useState<UpdateCheckSnapshot>(INITIAL_SNAPSHOT);
  const [backgroundUpdateAvailable, setBackgroundUpdateAvailable] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

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

        setSnapshot((previous) => ({
          ...previous,
          ...result.value,
        }));

        if (result.value.status === "updateAvailable") {
          setBackgroundUpdateAvailable(true);
        }
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

  const onOpenDownloadPage = useCallback((): void => {
    if (snapshot.downloadUrl === undefined) {
      return;
    }

    void useCase.openDownloadPage({ downloadUrl: snapshot.downloadUrl }).catch(() => {
      // Errors are logged in the use case; UI keeps last snapshot.
    });
  }, [snapshot.downloadUrl, useCase]);

  const onOpenReleaseNotes = useCallback((): void => {
    if (snapshot.releaseNotesUrl === undefined) {
      return;
    }

    void useCase.openDownloadPage({ downloadUrl: snapshot.releaseNotesUrl }).catch(() => {
      // Errors are logged in the use case; UI keeps last snapshot.
    });
  }, [snapshot.releaseNotesUrl, useCase]);

  const onDismissUpdatePrompt = useCallback((): void => {
    setPromptDismissed(true);
  }, []);

  const canCheckForUpdates = manifestUrl !== null && snapshot.status !== "checking";
  const canOpenDownloadPage =
    snapshot.status === "updateAvailable" && snapshot.downloadUrl !== undefined;
  const canOpenReleaseNotes = snapshot.releaseNotesUrl !== undefined;
  const isChecking = snapshot.status === "checking";
  const showUpdatePrompt = backgroundUpdateAvailable && !promptDismissed;
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

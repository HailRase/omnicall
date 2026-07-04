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

export type UseAppUpdateResult = Readonly<{
  snapshot: UpdateCheckSnapshot;
  statusMessage: string;
  canCheckForUpdates: boolean;
  canOpenDownloadPage: boolean;
  isChecking: boolean;
  onCheckForUpdates: () => void;
  onOpenDownloadPage: () => void;
}>;

/**
 * - Purpose: bind manual update check use case to settings About UI (F-020).
 * - Inputs: optional manifest URL override for tests.
 * - Outputs: update snapshot, localized status, and action callbacks.
 */
export function useAppUpdate(manifestUrlOverride?: string | null): UseAppUpdateResult {
  const { t } = useI18n();
  const manifestUrl = manifestUrlOverride ?? readUpdateManifestUrl();
  const useCaseRef = useRef<CheckForUpdatesUseCase | null>(null);
  const [snapshot, setSnapshot] = useState<UpdateCheckSnapshot>(INITIAL_SNAPSHOT);

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

  const canCheckForUpdates = manifestUrl !== null && snapshot.status !== "checking";
  const canOpenDownloadPage =
    snapshot.status === "updateAvailable" && snapshot.downloadUrl !== undefined;
  const isChecking = snapshot.status === "checking";
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
    isChecking,
    onCheckForUpdates,
    onOpenDownloadPage,
  };
}

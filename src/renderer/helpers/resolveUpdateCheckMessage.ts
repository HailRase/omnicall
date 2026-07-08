import type { UpdateCheckStatus } from "@application/use-cases/updates/CheckForUpdatesUseCase.js";
import type { Translator } from "../i18n/index.js";

export type UpdateCheckMessageInput = Readonly<{
  status: UpdateCheckStatus;
  latestVersion: string | undefined;
  t: Translator;
}>;

/**
 * - Purpose: map update-check status to localized UI copy (F-020).
 * - Inputs: check status, optional latest version, and renderer translator.
 * - Outputs: non-technical status message string.
 */
export function resolveUpdateCheckMessage(input: UpdateCheckMessageInput): string {
  switch (input.status) {
    case "idle":
      return input.t("updates.status.idle");
    case "checking":
      return input.t("updates.status.checking");
    case "updateAvailable":
      return input.t("updates.status.updateAvailable", {
        latestVersion: input.latestVersion,
      });
    case "upToDate":
      return input.t("updates.status.upToDate");
    case "unavailable":
      return input.t("updates.status.unavailable");
    case "invalidManifest":
      return input.t("updates.status.invalidManifest");
    case "error":
      return input.t("updates.status.error");
    default: {
      const exhaustive: never = input.status;
      return String(exhaustive);
    }
  }
}

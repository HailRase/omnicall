import type { UpdateCheckStatus } from "@application/use-cases/CheckForUpdatesUseCase.js";

export type UpdateCheckMessageInput = Readonly<{
  status: UpdateCheckStatus;
  latestVersion: string | undefined;
}>;

/**
 * - Purpose: map update-check status to Russian user-visible copy (F-020).
 * - Inputs: check status and optional latest version.
 * - Outputs: non-technical status message string.
 */
export function resolveUpdateCheckMessage(input: UpdateCheckMessageInput): string {
  switch (input.status) {
    case "idle":
      return "Нажмите «Проверить обновления», чтобы узнать о новой версии.";
    case "checking":
      return "Проверяем наличие обновлений…";
    case "updateAvailable":
      return input.latestVersion !== undefined
        ? `Доступна новая версия ${input.latestVersion}. Скачайте установщик и установите её вручную.`
        : "Доступна новая версия. Скачайте установщик и установите её вручную.";
    case "upToDate":
      return "У вас установлена последняя версия.";
    case "unavailable":
      return "Проверка обновлений сейчас недоступна.";
    case "invalidManifest":
      return "Не удалось прочитать данные об обновлении. Попробуйте позже.";
    case "error":
      return "Не удалось проверить обновления. Проверьте подключение к интернету и попробуйте снова.";
    default: {
      const exhaustive: never = input.status;
      return String(exhaustive);
    }
  }
}

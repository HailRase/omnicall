import type { AccountAuthorizationErrorProjection } from "@application/projections/settings/mapAccountAuthorizationError.js";
import type { Translator } from "../i18n/runtime.js";

/**
 * - Purpose: localize Account authorization error projection for Alert/toast copy.
 * - Inputs: typed translator and mapped error key/params.
 * - Outputs: user-visible string; always passes `detail` for parameterized keys.
 */
export function formatAccountAuthorizationError(
  t: Translator,
  error: AccountAuthorizationErrorProjection,
): string {
  if (error.key === "account.error.serverRegistration") {
    return t("account.error.serverRegistration", {
      detail: error.params?.detail ?? "",
    });
  }
  return t(error.key);
}

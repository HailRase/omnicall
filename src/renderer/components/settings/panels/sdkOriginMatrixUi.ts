/**
 * - Purpose: map ADR-0018 Origin matrix capability ids to Settings i18n keys.
 * - Inputs: SdkOriginMatrixCapabilityId.
 * - Outputs: TranslationKey for toggle labels (no localized text here).
 */
import type { SdkOriginMatrixCapabilityId } from "@application/index.js";
import { SDK_ORIGIN_MATRIX_CAPABILITY_IDS } from "@application/index.js";
import type { TranslationKey } from "../../../i18n/index.js";

export const SDK_ORIGIN_MATRIX_LABEL_KEYS: Readonly<
  Record<SdkOriginMatrixCapabilityId, TranslationKey>
> = {
  "session.read.redacted": "settings.integrations.sdk.matrix.sessionRead",
  "window.show": "settings.integrations.sdk.matrix.windowShow",
  "operator.status.write": "settings.integrations.sdk.matrix.operatorStatus",
  "session.logout": "settings.integrations.sdk.matrix.sessionLogout",
  "call.originate": "settings.integrations.sdk.matrix.callOriginate",
  "call.control": "settings.integrations.sdk.matrix.callControl",
  "account.activate": "settings.integrations.sdk.matrix.activate",
};

/** Technical capability ids for tooltip/title only — never primary UI labels. */
export const SDK_ORIGIN_MATRIX_TECH_IDS: Readonly<
  Record<SdkOriginMatrixCapabilityId, string>
> = {
  "session.read.redacted": "session.read.redacted",
  "window.show": "window.show",
  "operator.status.write": "operator.status.write",
  "session.logout": "session.logout",
  "call.originate": "call.originate",
  "call.control": "call.control",
  "account.activate": "account.activate",
};

export const SDK_ORIGIN_MATRIX_UI_CAPABILITY_IDS = SDK_ORIGIN_MATRIX_CAPABILITY_IDS;

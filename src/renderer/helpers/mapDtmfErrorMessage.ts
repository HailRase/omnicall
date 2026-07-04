import { translateCurrent } from "../i18n/index.js";

/**
 * - Purpose: map DTMF operation errors to operator-facing Russian copy.
 * - Inputs: raw projection error string or null.
 * - Outputs: localized user message or null when no error.
 */
export function mapDtmfErrorMessage(raw: string | null): string | null {
  if (raw === null) {
    return null;
  }

  const normalized = raw.toLowerCase();
  if (/session\s+not\s+found/.test(normalized)) {
    return translateCurrent("call.dtmf.error.sessionNotFound");
  }
  if (normalized.includes("invalid_state")) {
    return translateCurrent("call.dtmf.error.invalidState");
  }
  if (/not\s+implemented/.test(normalized)) {
    return translateCurrent("call.dtmf.error.notImplemented");
  }

  return translateCurrent("call.dtmf.error.default");
}

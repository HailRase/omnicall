import type { CodecPreferences } from "@domain/index.js";

/**
 * - Purpose: read persisted codec order/enablement for active user session.
 * - Inputs: none (adapter resolves current account from settings repository).
 * - Outputs: validated CodecPreferences aggregate from UserSettings v3.
 */
export interface CodecPreferencesPort {
  getCodecPreferences(): Promise<CodecPreferences>;
}

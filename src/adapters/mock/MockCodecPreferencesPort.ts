import { createDefaultCodecPreferences, type CodecPreferences } from "@domain/index.js";
import type { CodecPreferencesPort } from "@ports/index.js";

/**
 * - Purpose: fixed codec preferences for tests without settings repository.
 * - Inputs: optional CodecPreferences override at construction.
 * - Outputs: same preferences on every getCodecPreferences call.
 */
export class MockCodecPreferencesPort implements CodecPreferencesPort {
  private readonly preferences: CodecPreferences;

  constructor(preferences: CodecPreferences = createDefaultCodecPreferences()) {
    this.preferences = preferences;
  }

  getCodecPreferences(): Promise<CodecPreferences> {
    return Promise.resolve(this.preferences);
  }
}

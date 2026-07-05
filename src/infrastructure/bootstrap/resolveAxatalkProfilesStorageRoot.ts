import { join } from "node:path";

export const AXATALK_APP_DATA_DIRECTORY_NAME = "axatalk";

/**
 * - Purpose: resolve Axatalk profiles storage root under Electron userData.
 * - Inputs: absolute userData directory path from main process.
 * - Outputs: absolute storage root for FileSettingsRepository (parent of profiles/).
 */
export function resolveAxatalkProfilesStorageRoot(userDataPath: string): string {
  return join(userDataPath, AXATALK_APP_DATA_DIRECTORY_NAME);
}

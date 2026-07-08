import { join } from "node:path";

/**
 * - Purpose: map secret scope and id to an on-disk encrypted blob path.
 * - Inputs: secrets root directory, scope key, and secret id strings.
 * - Outputs: absolute file path for encrypted secret storage.
 */
export function resolveSecretStorageFilePath(
  secretsRoot: string,
  scopeKey: string,
  secretId: string,
): string {
  const scopeDirectory = join(secretsRoot, encodeURIComponent(scopeKey));
  return join(scopeDirectory, `${encodeURIComponent(secretId)}.enc`);
}

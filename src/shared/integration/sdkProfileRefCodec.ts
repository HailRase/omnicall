/**
 * Opaque SDK profileRef ↔ saved profile id (DI-08 / ADR-0013 §B).
 * Profile ids may contain `@` / `|` which OpaqueIdSchema forbids — encode for the wire.
 * Pure JS (no Node Buffer) so renderer Application can decode safely.
 */

const PROFILE_REF_PREFIX = "prf_" as const;

/**
 * - Purpose: encode a desktop saved-profile id into a protocol-safe opaque profileRef.
 * - Inputs: non-empty trimmed profile id string.
 * - Outputs: `prf_` + base64url(UTF-8 id), or null when empty / too long.
 */
export function encodeSdkProfileRef(profileId: string): string | null {
  const trimmed = profileId.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const encoded = bytesToBase64Url(new TextEncoder().encode(trimmed));
  const ref = `${PROFILE_REF_PREFIX}${encoded}`;
  return ref.length <= 128 ? ref : null;
}

/**
 * - Purpose: decode an opaque profileRef issued by desktop activate grant.
 * - Inputs: wire profileRef string.
 * - Outputs: saved profile id, or null when format is invalid.
 */
export function decodeSdkProfileRef(profileRef: string): string | null {
  const trimmed = profileRef.trim();
  if (!trimmed.startsWith(PROFILE_REF_PREFIX)) {
    return null;
  }
  const body = trimmed.slice(PROFILE_REF_PREFIX.length);
  if (body.length === 0) {
    return null;
  }
  const bytes = base64UrlToBytes(body);
  if (bytes === null) {
    return null;
  }
  const decoded = new TextDecoder().decode(bytes).trim();
  return decoded.length > 0 ? decoded : null;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToBytes(input: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/u.test(input)) {
    return null;
  }
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = padded.replace(/-/gu, "+").replace(/_/gu, "/");
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

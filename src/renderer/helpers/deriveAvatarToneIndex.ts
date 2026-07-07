const AVATAR_TONE_COUNT = 6;

/**
 * - Purpose: map a stable seed string to an avatar tone bucket index.
 * - Inputs: display label or identifier used as hash seed.
 * - Outputs: integer tone index in `[0, AVATAR_TONE_COUNT)`.
 */
export function deriveAvatarToneIndex(seed: string): number {
  const normalized = seed.trim().toLowerCase();
  if (normalized.length === 0) {
    return 0;
  }

  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash + normalized.charCodeAt(index) * (index + 1)) % AVATAR_TONE_COUNT;
  }

  return hash;
}

export { AVATAR_TONE_COUNT };

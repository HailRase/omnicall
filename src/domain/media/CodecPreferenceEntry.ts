/**
 * - Purpose: one ordered codec row in user codec preferences.
 * - Inputs: codec id, enabled flag, zero-based order index.
 * - Outputs: immutable CodecPreferenceEntry value object.
 */

export type CodecPreferenceEntry<TId extends string> = Readonly<{
  id: TId;
  enabled: boolean;
  order: number;
}>;

export function createCodecPreferenceEntry<TId extends string>(
  id: TId,
  enabled: boolean,
  order: number,
): CodecPreferenceEntry<TId> {
  return { id, enabled, order };
}

import {
  AUDIO_CODEC_IDS,
  DTMF_AUDIO_CODEC_ID,
  parseAudioCodecId,
  parseVideoCodecId,
  VIDEO_CODEC_IDS,
  type AudioCodecId,
} from "./CodecId.js";
import type { CodecPreferenceEntry } from "./CodecPreferenceEntry.js";
import {
  createDefaultCodecPreferences,
  VOICE_AUDIO_CODEC_IDS,
  type CodecPreferences,
} from "./CodecPreferences.js";

export type ValidateCodecPreferencesResult =
  | Readonly<{ ok: true; value: CodecPreferences }>
  | Readonly<{ ok: false; errors: ReadonlyArray<string> }>;

/**
 * - Purpose: narrow unknown JSON to CodecPreferences with business invariants.
 * - Inputs: unknown payload from settings repository boundary.
 * - Outputs: validated CodecPreferences or structured error codes.
 */
export function validateCodecPreferences(value: unknown): ValidateCodecPreferencesResult {
  if (value === undefined) {
    return { ok: true, value: createDefaultCodecPreferences() };
  }

  if (typeof value !== "object" || value === null) {
    return { ok: false, errors: ["codecPreferences_not_object"] };
  }

  const record = value as Record<string, unknown>;
  const errors: string[] = [];

  const audio = readCodecEntries(record["audio"], AUDIO_CODEC_IDS, parseAudioCodecId, "audio", errors);
  const video = readCodecEntries(record["video"], VIDEO_CODEC_IDS, parseVideoCodecId, "video", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const audioOrderErrors = validateOrderPermutation(audio, "audio");
  const videoOrderErrors = validateOrderPermutation(video, "video");
  errors.push(...audioOrderErrors, ...videoOrderErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const normalizedAudio = normalizeEntries(audio, AUDIO_CODEC_IDS);
  const normalizedVideo = normalizeEntries(video, VIDEO_CODEC_IDS);

  const businessErrors = validateBusinessRules(normalizedAudio);
  if (businessErrors.length > 0) {
    return { ok: false, errors: businessErrors };
  }

  return {
    ok: true,
    value: {
      audio: normalizedAudio,
      video: normalizedVideo,
    },
  };
}

function readCodecEntries<TId extends string>(
  raw: unknown,
  expectedIds: readonly TId[],
  parseId: (value: unknown) => TId | null,
  kind: "audio" | "video",
  errors: string[],
): ReadonlyArray<CodecPreferenceEntry<TId>> {
  if (!Array.isArray(raw)) {
    errors.push(`codecPreferences_${kind}_not_array`);
    return [];
  }

  const entries: CodecPreferenceEntry<TId>[] = [];

  for (let index = 0; index < raw.length; index += 1) {
    const item: unknown = raw[index];
    if (typeof item !== "object" || item === null) {
      errors.push(`codecPreferences_${kind}_entry_${index}_not_object`);
      continue;
    }

    const row = item as Record<string, unknown>;
    const id = parseId(row["id"]);
    if (id === null) {
      errors.push(`codecPreferences_${kind}_entry_${index}_id_invalid`);
      continue;
    }

    const enabled = row["enabled"];
    if (typeof enabled !== "boolean") {
      errors.push(`codecPreferences_${kind}_entry_${index}_enabled_invalid`);
      continue;
    }

    const order = row["order"];
    if (typeof order !== "number" || !Number.isInteger(order) || order < 0) {
      errors.push(`codecPreferences_${kind}_entry_${index}_order_invalid`);
      continue;
    }

    entries.push({ id, enabled, order });
  }

  if (entries.length !== expectedIds.length) {
    errors.push(`codecPreferences_${kind}_count_mismatch`);
  }

  const ids = new Set(entries.map((entry) => entry.id));
  for (const expectedId of expectedIds) {
    if (!ids.has(expectedId)) {
      errors.push(`codecPreferences_${kind}_missing_${expectedId}`);
    }
  }

  const duplicateIds = entries.length - ids.size;
  if (duplicateIds > 0) {
    errors.push(`codecPreferences_${kind}_duplicate_id`);
  }

  return entries;
}

function normalizeEntries<TId extends string>(
  entries: ReadonlyArray<CodecPreferenceEntry<TId>>,
  expectedIds: readonly TId[],
): ReadonlyArray<CodecPreferenceEntry<TId>> {
  const byId = new Map(entries.map((entry) => [entry.id, entry] as const));
  const sorted = [...expectedIds]
    .map((id) => byId.get(id))
    .filter((entry): entry is CodecPreferenceEntry<TId> => entry !== undefined)
    .sort((left, right) => left.order - right.order);

  return sorted.map((entry, index) => ({
    id: entry.id,
    enabled: entry.enabled,
    order: index,
  }));
}

function validateOrderPermutation<TId extends string>(
  entries: ReadonlyArray<CodecPreferenceEntry<TId>>,
  kind: "audio" | "video",
): string[] {
  const orders = entries.map((entry) => entry.order);
  if (!isSequentialOrder(orders)) {
    return [`codecPreferences_${kind}_order_invalid`];
  }
  return [];
}

function validateBusinessRules(
  audio: ReadonlyArray<CodecPreferenceEntry<AudioCodecId>>,
): string[] {
  const errors: string[] = [];

  const dtmf = audio.find((entry) => entry.id === DTMF_AUDIO_CODEC_ID);
  if (dtmf !== undefined && !dtmf.enabled) {
    errors.push("codecPreferences_telephone_event_must_stay_enabled");
  }

  const enabledVoiceCount = VOICE_AUDIO_CODEC_IDS.filter((id) => {
    const entry = audio.find((row) => row.id === id);
    return entry?.enabled === true;
  }).length;

  if (enabledVoiceCount < 1) {
    errors.push("codecPreferences_at_least_one_voice_audio_required");
  }

  return errors;
}

function isSequentialOrder(orders: readonly number[]): boolean {
  if (orders.length === 0) {
    return false;
  }
  const sorted = [...orders].sort((a, b) => a - b);
  return sorted.every((order, index) => order === index);
}

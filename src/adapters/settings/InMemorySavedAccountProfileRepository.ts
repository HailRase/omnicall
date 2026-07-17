import {
  createSavedAccountProfile,
  findSavedAccountProfileByInput,
  markSavedAccountProfileSuccessful,
  mergeSavedAccountProfileLifecycleStatus,
  type SavedAccountProfile,
  type SavedAccountProfileId,
  type SavedAccountProfileInput,
} from "@domain/index.js";
import type {
  SavedAccountProfileRepository,
  SaveSavedAccountProfileOptions,
} from "@ports/settings/SavedAccountProfileRepository.js";

/**
 * - Purpose: in-memory saved SIP account profile store for tests and mock bootstrap.
 * - Inputs: profile metadata without password.
 * - Outputs: SavedAccountProfileRepository with idempotent save semantics.
 */
export class InMemorySavedAccountProfileRepository implements SavedAccountProfileRepository {
  private readonly profiles = new Map<SavedAccountProfileId, SavedAccountProfile>();

  listProfiles(): Promise<ReadonlyArray<SavedAccountProfile>> {
    const sorted = [...this.profiles.values()].sort((left, right) =>
      left.displayName.localeCompare(right.displayName, undefined, { sensitivity: "base" }),
    );
    return Promise.resolve(sorted);
  }

  saveProfile(
    input: SavedAccountProfileInput,
    options?: SaveSavedAccountProfileOptions,
  ): Promise<SavedAccountProfile> {
    const existing = findSavedAccountProfileByInput([...this.profiles.values()], input);
    if (existing !== null) {
      const updated = mergeExistingSavedProfile(existing, options);
      this.profiles.set(updated.id, updated);
      return Promise.resolve(updated);
    }

    const created = createSavedAccountProfile(input, {
      createdAt: new Date().toISOString(),
      lifecycleStatus: options?.lifecycleStatus ?? "draft",
      ...(options?.ocpDomain !== undefined ? { ocpDomain: options.ocpDomain } : {}),
      ...(options?.successfulUseAt !== undefined
        ? { successfulUseAt: options.successfulUseAt }
        : {}),
    });
    if (!created.ok) {
      throw new Error(`saved_profile_validation_failed:${created.errors.join(",")}`);
    }

    this.profiles.set(created.value.id, created.value);
    return Promise.resolve(created.value);
  }

  deleteProfile(profileId: SavedAccountProfileId): Promise<void> {
    this.profiles.delete(profileId);
    return Promise.resolve();
  }

  touchLastUsedAt(profileId: SavedAccountProfileId): Promise<void> {
    const existing = this.profiles.get(profileId);
    if (existing === undefined) {
      return Promise.resolve();
    }

    this.profiles.set(profileId, {
      ...existing,
      lastUsedAt: new Date().toISOString(),
    });
    return Promise.resolve();
  }

  markProfileSuccessful(
    profileId: SavedAccountProfileId,
    successfulUseAt: string,
  ): Promise<SavedAccountProfile | null> {
    const existing = this.profiles.get(profileId);
    if (existing === undefined) {
      return Promise.resolve(null);
    }

    const promoted = markSavedAccountProfileSuccessful(existing, successfulUseAt);
    this.profiles.set(profileId, promoted);
    return Promise.resolve(promoted);
  }

  getProfileById(profileId: SavedAccountProfileId): Promise<SavedAccountProfile | null> {
    return Promise.resolve(this.profiles.get(profileId) ?? null);
  }

  /** Replaces all profiles — used when hydrating from disk parse result. */
  replaceProfiles(profiles: ReadonlyArray<SavedAccountProfile>): void {
    this.profiles.clear();
    for (const profile of profiles) {
      this.profiles.set(profile.id, profile);
    }
  }
}

function mergeExistingSavedProfile(
  existing: SavedAccountProfile,
  options: SaveSavedAccountProfileOptions | undefined,
): SavedAccountProfile {
  const ocpDomain =
    options?.ocpDomain !== undefined
      ? normalizeOptionalDomain(options.ocpDomain)
      : existing.ocpDomain;

  return {
    ...existing,
    ...(options?.lifecycleStatus !== undefined
      ? {
          lifecycleStatus: mergeSavedAccountProfileLifecycleStatus(
            existing.lifecycleStatus,
            options.lifecycleStatus,
          ),
        }
      : {}),
    ...(options?.successfulUseAt !== undefined
      ? { successfulUseAt: options.successfulUseAt }
      : {}),
    ...(ocpDomain !== undefined ? { ocpDomain } : {}),
  };
}

function normalizeOptionalDomain(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

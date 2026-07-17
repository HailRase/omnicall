import type {
  SavedAccountProfile,
  SavedAccountProfileId,
  SavedAccountProfileInput,
  SavedAccountProfileLifecycleStatus,
} from "@domain/index.js";

export type SaveSavedAccountProfileOptions = Readonly<{
  lifecycleStatus?: SavedAccountProfileLifecycleStatus;
  ocpDomain?: string;
  successfulUseAt?: string;
}>;

export interface SavedAccountProfileRepository {
  listProfiles(): Promise<ReadonlyArray<SavedAccountProfile>>;
  saveProfile(
    input: SavedAccountProfileInput,
    options?: SaveSavedAccountProfileOptions,
  ): Promise<SavedAccountProfile>;
  deleteProfile(profileId: SavedAccountProfileId): Promise<void>;
  touchLastUsedAt(profileId: SavedAccountProfileId): Promise<void>;
  markProfileSuccessful(
    profileId: SavedAccountProfileId,
    successfulUseAt: string,
  ): Promise<SavedAccountProfile | null>;
  getProfileById(profileId: SavedAccountProfileId): Promise<SavedAccountProfile | null>;
}

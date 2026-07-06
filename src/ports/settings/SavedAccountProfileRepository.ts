import type {
  SavedAccountProfile,
  SavedAccountProfileId,
  SavedAccountProfileInput,
} from "@domain/index.js";

export interface SavedAccountProfileRepository {
  listProfiles(): Promise<ReadonlyArray<SavedAccountProfile>>;
  saveProfile(input: SavedAccountProfileInput): Promise<SavedAccountProfile>;
  deleteProfile(profileId: SavedAccountProfileId): Promise<void>;
  touchLastUsedAt(profileId: SavedAccountProfileId): Promise<void>;
  getProfileById(profileId: SavedAccountProfileId): Promise<SavedAccountProfile | null>;
}

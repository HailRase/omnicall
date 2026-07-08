import { describe, expect, it } from "vitest";
import { InMemorySavedAccountProfileRepository } from "@adapters/settings/InMemorySavedAccountProfileRepository.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { deriveSettingsAccountKeyFromIdentity } from "@domain/index.js";
import { isErr } from "@shared/result/index.js";
import { SaveAccountProfileUseCase } from "./SaveAccountProfileUseCase.js";
import { DeleteSavedAccountProfileUseCase } from "./DeleteSavedAccountProfileUseCase.js";
import { ListSavedAccountProfilesUseCase } from "./ListSavedAccountProfilesUseCase.js";

const profileInput = {
  username: "alex.supervisor",
  domain: "pbx.example",
  server: "sip:pbx.example",
} as const;

describe("SaveAccountProfileUseCase", () => {
  it("saves profile metadata without password", async () => {
    const repository = new InMemorySavedAccountProfileRepository();
    const useCase = new SaveAccountProfileUseCase(repository, createTestLogger());

    const result = await useCase.execute({ profile: profileInput });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.username).toBe("alex.supervisor");
    expect("password" in result.value).toBe(false);
  });

  it("does not duplicate profiles for the same identity", async () => {
    const repository = new InMemorySavedAccountProfileRepository();
    const useCase = new SaveAccountProfileUseCase(repository, createTestLogger());

    const first = await useCase.execute({ profile: profileInput });
    const second = await useCase.execute({
      profile: {
        username: "  alex.supervisor ",
        domain: "https://pbx.example",
        server: "sip:pbx.example",
      },
    });

    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }

    expect(second.value.id).toBe(first.value.id);
    const listed = await repository.listProfiles();
    expect(listed).toHaveLength(1);
  });
});

describe("DeleteSavedAccountProfileUseCase", () => {
  it("removes saved profile metadata only", async () => {
    const repository = new InMemorySavedAccountProfileRepository();
    const settings = new InMemorySettingsRepository();
    const saveUseCase = new SaveAccountProfileUseCase(repository, createTestLogger());
    const deleteUseCase = new DeleteSavedAccountProfileUseCase(repository, createTestLogger());

    const saved = await saveUseCase.execute({ profile: profileInput });
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }

    const settingsKey = deriveSettingsAccountKeyFromIdentity(profileInput);
    await settings.saveUserSettings(settingsKey, {
      ...(await settings.getUserSettings(settingsKey)),
      language: "en",
    });

    const deleted = await deleteUseCase.execute({ profileId: saved.value.id });
    expect(deleted.ok).toBe(true);

    const listed = await repository.listProfiles();
    expect(listed).toHaveLength(0);
    expect((await settings.getUserSettings(settingsKey)).language).toBe("en");
  });

  it("returns not_found for missing profile", async () => {
    const deleteUseCase = new DeleteSavedAccountProfileUseCase(
      new InMemorySavedAccountProfileRepository(),
      createTestLogger(),
    );

    const result = await deleteUseCase.execute({
      profileId: deriveSettingsAccountKeyFromIdentity(profileInput),
    });

    expect(isErr(result)).toBe(true);
  });
});

describe("ListSavedAccountProfilesUseCase", () => {
  it("lists saved profiles sorted by display name", async () => {
    const repository = new InMemorySavedAccountProfileRepository();
    const saveUseCase = new SaveAccountProfileUseCase(repository, createTestLogger());
    const listUseCase = new ListSavedAccountProfilesUseCase(repository, createTestLogger());

    await saveUseCase.execute({
      profile: { username: "zeta", domain: "pbx.example", server: "sip:pbx.example" },
    });
    await saveUseCase.execute({
      profile: { username: "alpha", domain: "pbx.example", server: "sip:pbx.example" },
    });

    const result = await listUseCase.execute();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.map((profile) => profile.displayName)).toEqual(["alpha", "zeta"]);
  });
});

import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LEGACY_APP_DATA_DIRECTORY_NAME,
  LEGACY_USER_DATA_FOLDER_NAME,
  migrateLegacyAppDataIfNeeded,
  resolveLegacyUserDataPath,
  resolveOmniCallProfilesStorageRoot,
} from "./resolveOmniCallProfilesStorageRoot.js";

describe("resolveOmniCallProfilesStorageRoot", () => {
  it("resolves omnicall directory under userData", () => {
    expect(resolveOmniCallProfilesStorageRoot("C:/Users/app/AppData/Roaming/OmniCall")).toMatch(
      /omnicall$/,
    );
  });

  it("resolves sibling legacy userData path from pre-rebrand productName", () => {
    expect(resolveLegacyUserDataPath(join("C:", "Users", "app", "AppData", "Roaming", "OmniCall"))).toBe(
      join("C:", "Users", "app", "AppData", "Roaming", LEGACY_USER_DATA_FOLDER_NAME),
    );
  });

  it("copies legacy app data into empty omnicall root", () => {
    const parent = mkdtempSync(join(tmpdir(), "omnicall-migrate-"));
    const legacyUserData = join(parent, LEGACY_USER_DATA_FOLDER_NAME);
    const currentUserData = join(parent, "OmniCall");
    const legacyRoot = join(legacyUserData, LEGACY_APP_DATA_DIRECTORY_NAME);
    mkdirSync(join(legacyRoot, "profiles"), { recursive: true });
    writeFileSync(join(legacyRoot, "profiles", "active.json"), '{"ok":true}\n', "utf8");
    mkdirSync(currentUserData, { recursive: true });

    expect(migrateLegacyAppDataIfNeeded(currentUserData)).toBe("migrated");

    const target = resolveOmniCallProfilesStorageRoot(currentUserData);
    expect(readFileSync(join(target, "profiles", "active.json"), "utf8")).toContain("ok");
    expect(existsSync(join(legacyRoot, "profiles", "active.json"))).toBe(true);
  });

  it("skips when omnicall target already has data", () => {
    const parent = mkdtempSync(join(tmpdir(), "omnicall-migrate-skip-"));
    const currentUserData = join(parent, "OmniCall");
    const target = resolveOmniCallProfilesStorageRoot(currentUserData);
    mkdirSync(join(target, "profiles"), { recursive: true });
    writeFileSync(join(target, "profiles", "keep.json"), "{}\n", "utf8");

    expect(migrateLegacyAppDataIfNeeded(currentUserData)).toBe(
      "skipped_target_present",
    );
  });
});

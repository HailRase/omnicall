// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  LEGACY_UPDATE_BANNER_DISMISS_STORAGE_KEY,
  LocalStorageUpdateBannerDismissStore,
  UPDATE_BANNER_DISMISS_STORAGE_KEY,
} from "./LocalStorageUpdateBannerDismissStore.js";

describe("LocalStorageUpdateBannerDismissStore", () => {
  afterEach(() => {
    localStorage.removeItem(UPDATE_BANNER_DISMISS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_UPDATE_BANNER_DISMISS_STORAGE_KEY);
  });

  it("returns null when no dismissed version is stored", () => {
    const store = new LocalStorageUpdateBannerDismissStore();

    expect(store.readDismissedVersion()).toBeNull();
  });

  it("round-trips dismissed version through localStorage", () => {
    const store = new LocalStorageUpdateBannerDismissStore();

    store.writeDismissedVersion("0.1.3");

    expect(store.readDismissedVersion()).toBe("0.1.3");
  });

  it("trims stored version on write", () => {
    const store = new LocalStorageUpdateBannerDismissStore();

    store.writeDismissedVersion("  0.1.3  ");

    expect(store.readDismissedVersion()).toBe("0.1.3");
  });

  it("migrates LEGACY dismiss key into omnicall key on read", () => {
    localStorage.setItem(LEGACY_UPDATE_BANNER_DISMISS_STORAGE_KEY, "0.14.0");
    const store = new LocalStorageUpdateBannerDismissStore();

    expect(store.readDismissedVersion()).toBe("0.14.0");
    expect(localStorage.getItem(UPDATE_BANNER_DISMISS_STORAGE_KEY)).toBe("0.14.0");
    expect(localStorage.getItem(LEGACY_UPDATE_BANNER_DISMISS_STORAGE_KEY)).toBeNull();
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  LocalStorageUpdateBannerDismissStore,
  UPDATE_BANNER_DISMISS_STORAGE_KEY,
} from "./LocalStorageUpdateBannerDismissStore.js";

describe("LocalStorageUpdateBannerDismissStore", () => {
  afterEach(() => {
    localStorage.removeItem(UPDATE_BANNER_DISMISS_STORAGE_KEY);
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
});

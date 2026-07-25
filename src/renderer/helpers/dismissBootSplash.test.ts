// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { dismissBootSplash } from "./bootSplashDom.js";

describe("dismissBootSplash", () => {
  afterEach(() => {
    document.getElementById("boot-splash")?.remove();
  });

  it("removes the pre-React boot splash node when present", () => {
    const node = document.createElement("div");
    node.id = "boot-splash";
    document.body.append(node);

    dismissBootSplash();

    expect(document.getElementById("boot-splash")).toBeNull();
  });

  it("is a no-op when the boot splash is already gone", () => {
    expect(() => dismissBootSplash()).not.toThrow();
  });
});

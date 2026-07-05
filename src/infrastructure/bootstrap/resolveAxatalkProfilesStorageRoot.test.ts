import { describe, expect, it } from "vitest";
import { resolveAxatalkProfilesStorageRoot } from "./resolveAxatalkProfilesStorageRoot.js";

describe("resolveAxatalkProfilesStorageRoot", () => {
  it("resolves axatalk directory under userData", () => {
    expect(resolveAxatalkProfilesStorageRoot("C:/Users/app/AppData/Roaming/Axatalk")).toMatch(
      /axatalk$/,
    );
  });
});

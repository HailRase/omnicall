import { describe, expect, it } from "vitest";
import {
  clearPendingDisplaySourceId,
  setPendingDisplaySourceId,
  takePendingDisplaySourceId,
} from "./pendingDisplaySourceStore.js";

describe("pendingDisplaySourceStore", () => {
  it("stores, takes once, and clears pending source ids per webContents", () => {
    setPendingDisplaySourceId(7, "screen:0:0");
    expect(takePendingDisplaySourceId(7)).toBe("screen:0:0");
    expect(takePendingDisplaySourceId(7)).toBeNull();

    setPendingDisplaySourceId(7, "window:1:0");
    clearPendingDisplaySourceId(7);
    expect(takePendingDisplaySourceId(7)).toBeNull();

    setPendingDisplaySourceId(8, null);
    expect(takePendingDisplaySourceId(8)).toBeNull();
  });
});

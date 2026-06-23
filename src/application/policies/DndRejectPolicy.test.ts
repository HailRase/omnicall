import { describe, expect, it } from "vitest";
import { decideDndIncomingReject } from "./DndRejectPolicy.js";

describe("DndRejectPolicy", () => {
  it("rejects incoming when status is dnd", () => {
    expect(decideDndIncomingReject("dnd")).toEqual({
      shouldReject: true,
      sipCode: 486,
    });
  });

  it("does not reject incoming when status is online", () => {
    expect(decideDndIncomingReject("online")).toEqual({
      shouldReject: false,
      sipCode: null,
    });
  });
});

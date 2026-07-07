import { describe, expect, it } from "vitest";
import { groupHistoryRowsByDate } from "./groupHistoryRowsByDate.js";

describe("groupHistoryRowsByDate", () => {
  const now = new Date("2026-07-07T15:00:00");

  it("groups rows into today and yesterday sections", () => {
    const sections = groupHistoryRowsByDate({
      rows: [
        { id: "today", startedAtIso: "2026-07-07T10:00:00" },
        { id: "yesterday", startedAtIso: "2026-07-06T09:30:00" },
      ],
      language: "en",
      now,
      translate: (key) => key,
    });

    expect(sections).toHaveLength(2);
    expect(sections[0]?.group.kind).toBe("today");
    expect(sections[0]?.rows.map((row) => row.id)).toEqual(["today"]);
    expect(sections[1]?.group.kind).toBe("yesterday");
  });
});

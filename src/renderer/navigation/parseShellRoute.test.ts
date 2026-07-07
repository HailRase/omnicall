import { describe, expect, it } from "vitest";
import { parseShellRoute } from "./parseShellRoute.js";

describe("parseShellRoute", () => {
  it("parses dialpad, history, contacts list, and settings routes", () => {
    expect(parseShellRoute("/")).toEqual({ name: "dialpad" });
    expect(parseShellRoute("/history")).toEqual({ name: "history" });
    expect(parseShellRoute("/contacts")).toEqual({ name: "contacts" });
    expect(parseShellRoute("/settings")).toEqual({ name: "settings", section: "general" });
    expect(parseShellRoute("/settings/sessions")).toEqual({
      name: "settings",
      section: "sessions",
    });
  });

  it("falls back invalid settings section ids to general", () => {
    expect(parseShellRoute("/settings/not-a-section")).toEqual({
      name: "settings",
      section: "general",
    });
  });

  it("parses contact detail and edit routes", () => {
    expect(parseShellRoute("/contacts/agent-1")).toEqual({
      name: "contactDetails",
      contactId: "agent-1",
      notFound: false,
    });
    expect(parseShellRoute("/contacts/agent-1/edit")).toEqual({
      name: "contactEdit",
      contactId: "agent-1",
      notFound: false,
    });
  });

  it("marks invalid contact ids as not found without throwing", () => {
    expect(parseShellRoute("/contacts/bad id")).toEqual({
      name: "contactDetails",
      contactId: "bad id",
      notFound: true,
    });
  });

  it("falls back unknown paths to dialpad", () => {
    expect(parseShellRoute("/unknown")).toEqual({ name: "dialpad" });
  });
});

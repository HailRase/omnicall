import { describe, expect, it } from "vitest";
import { createSavedAccountProfile } from "@domain/index.js";
import { deriveSavedAccountProfileAvailability } from "./deriveSavedAccountProfileAvailability.js";

describe("deriveSavedAccountProfileAvailability", () => {
  it("exposes booleans only and computes OCP completeness", () => {
    const created = createSavedAccountProfile(
      {
        username: "agent",
        domain: "pbx.example",
        server: "wss://pbx.example/ws",
      },
      { ocpDomain: "ocp.example", lifecycleStatus: "draft" },
    );
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const view = deriveSavedAccountProfileAvailability({
      profile: created.value,
      hasSavedSipPassword: true,
      hasSavedOcpApiKey: true,
    });

    expect(view).toEqual({
      profile: created.value,
      hasSavedSipPassword: true,
      hasSavedOcpApiKey: true,
      hasCompleteOcpConfiguration: true,
      isDraft: true,
    });
    expect(JSON.stringify(view)).not.toContain("password");
    expect(JSON.stringify(view)).not.toContain("api-key");
  });
});

import { describe, expect, it } from "vitest";
import { createSavedAccountProfile } from "./SavedAccountProfile.js";
import {
  hasCompleteOcpConfiguration,
  isDraftSavedAccountProfile,
  isSuccessfulSavedAccountProfile,
  markSavedAccountProfileSuccessful,
  mergeSavedAccountProfileLifecycleStatus,
  resolveSavedAccountProfileLifecycleStatus,
} from "./savedAccountProfileLifecycle.js";

describe("savedAccountProfileLifecycle", () => {
  it("treats missing lifecycle status as successful for legacy profiles", () => {
    expect(resolveSavedAccountProfileLifecycleStatus(undefined)).toBe("successful");
  });

  it("marks new profiles as draft by default", () => {
    const created = createSavedAccountProfile({
      username: "agent",
      domain: "pbx.example",
      server: "wss://pbx.example/ws",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    expect(isDraftSavedAccountProfile(created.value)).toBe(true);
    expect(isSuccessfulSavedAccountProfile(created.value)).toBe(false);
  });

  it("promotes draft to successful without touching secrets", () => {
    const created = createSavedAccountProfile({
      username: "agent",
      domain: "pbx.example",
      server: "wss://pbx.example/ws",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const promoted = markSavedAccountProfileSuccessful(
      created.value,
      "2026-07-16T12:00:00.000Z",
    );

    expect(promoted.lifecycleStatus).toBe("successful");
    expect(promoted.successfulUseAt).toBe("2026-07-16T12:00:00.000Z");
    expect(promoted.lastUsedAt).toBe("2026-07-16T12:00:00.000Z");
    expect("password" in promoted).toBe(false);
  });

  it("never demotes a successful profile when draft artifacts are saved", () => {
    expect(mergeSavedAccountProfileLifecycleStatus("successful", "draft")).toBe(
      "successful",
    );
    expect(mergeSavedAccountProfileLifecycleStatus("draft", "successful")).toBe(
      "successful",
    );
    expect(mergeSavedAccountProfileLifecycleStatus("draft", "draft")).toBe("draft");
  });

  it("requires ocp domain and api-key presence for complete OCP configuration", () => {
    expect(
      hasCompleteOcpConfiguration({ ocpDomain: "ocp.example", hasSavedOcpApiKey: true }),
    ).toBe(true);
    expect(
      hasCompleteOcpConfiguration({ ocpDomain: "  ", hasSavedOcpApiKey: true }),
    ).toBe(false);
    expect(
      hasCompleteOcpConfiguration({ ocpDomain: "ocp.example", hasSavedOcpApiKey: false }),
    ).toBe(false);
  });
});

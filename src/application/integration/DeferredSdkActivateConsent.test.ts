import { afterEach, describe, expect, it, vi } from "vitest";
import { DeferredSdkActivateConsent } from "./DeferredSdkActivateConsent.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("DeferredSdkActivateConsent", () => {
  it("assigns a unique attentionId per consent episode", async () => {
    let seq = 0;
    const onPendingChange = vi.fn();
    const deferred = new DeferredSdkActivateConsent({
      onPendingChange,
      createAttentionId: () => `att_${(++seq).toString()}`,
    });

    const firstPromise = deferred.requestConsent({
      kind: "activate",
      origin: "https://crm.example",
      login: "1001",
      profileLabel: "Agent",
      availableModes: ["sip_only"],
    });
    expect(deferred.getPending()?.attentionId).toBe("att_1");
    deferred.settle("dismiss");
    await firstPromise;

    const secondPromise = deferred.requestConsent({
      kind: "activate",
      origin: "https://crm.example",
      login: "1001",
      profileLabel: "Agent",
      availableModes: ["sip_only"],
    });
    expect(deferred.getPending()?.attentionId).toBe("att_2");
    deferred.settle("dismiss");
    await secondPromise;
  });

  it("assigns attentionId for logout_required notice", () => {
    const deferred = new DeferredSdkActivateConsent({
      createAttentionId: () => "att_logout",
    });
    deferred.notifyLogoutRequired({
      origin: "https://crm.example",
      login: "1002",
      profileLabel: "Other",
      currentProfileLabel: "Current",
    });
    expect(deferred.getPending()).toMatchObject({
      kind: "logout_required",
      attentionId: "att_logout",
    });
  });

  it("auto-dismisses activate consent with timeout after TTL and clears pending", async () => {
    vi.useFakeTimers();
    const onPendingChange = vi.fn();
    const deferred = new DeferredSdkActivateConsent({
      onPendingChange,
      createAttentionId: () => "att_ttl",
      consentTtlMs: 1_000,
    });

    const pending = deferred.requestConsent({
      kind: "activate",
      origin: "https://crm.example",
      login: "1001",
      profileLabel: "Agent",
      availableModes: ["sip_only"],
    });
    expect(deferred.isPending()).toBe(true);
    expect(deferred.getPending()?.expiresAt).toEqual(expect.any(String));

    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toEqual({ decision: "timeout" });
    expect(deferred.isPending()).toBe(false);
    expect(onPendingChange).toHaveBeenLastCalledWith(null);

    const retry = deferred.requestConsent({
      kind: "activate",
      origin: "https://crm.example",
      login: "1001",
      profileLabel: "Agent",
      availableModes: ["sip_only"],
    });
    expect(deferred.isPending()).toBe(true);
    deferred.settle("dismiss");
    await expect(retry).resolves.toEqual({ decision: "dismiss" });
  });

  it("clears TTL timer when operator settles before expiry", async () => {
    vi.useFakeTimers();
    const deferred = new DeferredSdkActivateConsent({
      createAttentionId: () => "att_early",
      consentTtlMs: 5_000,
    });
    const pending = deferred.requestConsent({
      kind: "activate",
      origin: "https://crm.example",
      login: "1001",
      profileLabel: "Agent",
      availableModes: ["ocp", "sip_only"],
      preferredMode: "ocp",
    });
    deferred.settle("allow", "ocp");
    await expect(pending).resolves.toEqual({ decision: "allow", mode: "ocp" });
    await vi.advanceTimersByTimeAsync(5_000);
    expect(deferred.isPending()).toBe(false);
  });
});

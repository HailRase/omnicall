import { describe, expect, it, vi } from "vitest";
import { DeferredSdkActivateConsent } from "./DeferredSdkActivateConsent.js";

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
});

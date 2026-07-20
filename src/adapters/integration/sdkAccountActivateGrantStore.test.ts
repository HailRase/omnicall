/**
 * Unit tests for short-lived account activate grants (DI-08).
 */

import { describe, expect, it } from "vitest";

import {
  SdkAccountActivateGrantStore,
  SDK_ACCOUNT_ACTIVATE_GRANT_TTL_MS,
} from "./sdkAccountActivateGrantStore.js";
import { encodeSdkProfileRef } from "@shared/integration/sdkProfileRefCodec.js";

describe("SdkAccountActivateGrantStore", () => {
  it("issues opaque profileRef and validates until expiry", () => {
    const store = new SdkAccountActivateGrantStore();
    const nowMs = 1_000_000;
    const issued = store.issue({
      clientId: "client_1",
      profileId: "1001@pbx.example",
      nowMs,
    });
    expect(issued.ok).toBe(true);
    if (!issued.ok) {
      return;
    }
    expect(issued.grant.profileRef).toBe(
      encodeSdkProfileRef("1001@pbx.example"),
    );
    expect(
      store.hasValidGrant("client_1", issued.grant.profileRef, nowMs + 1),
    ).toBe(true);
    expect(
      store.hasValidGrant(
        "client_1",
        issued.grant.profileRef,
        nowMs + SDK_ACCOUNT_ACTIVATE_GRANT_TTL_MS + 1,
      ),
    ).toBe(false);
  });

  it("does not allow another client to use the grant", () => {
    const store = new SdkAccountActivateGrantStore();
    const issued = store.issue({
      clientId: "client_a",
      profileId: "1001@pbx.example",
      nowMs: 0,
    });
    expect(issued.ok).toBe(true);
    if (!issued.ok) {
      return;
    }
    expect(
      store.hasValidGrant("client_b", issued.grant.profileRef, 1),
    ).toBe(false);
  });

  it("clearForClient removes grants", () => {
    const store = new SdkAccountActivateGrantStore();
    const issued = store.issue({
      clientId: "client_x",
      profileId: "1001@pbx.example",
      nowMs: 0,
    });
    expect(issued.ok).toBe(true);
    if (!issued.ok) {
      return;
    }
    expect(store.clearForClient("client_x")).toBe(1);
    expect(
      store.hasValidGrant("client_x", issued.grant.profileRef, 1),
    ).toBe(false);
  });
});

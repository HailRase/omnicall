import { describe, expect, it } from "vitest";
import { SnapshotSectionsSchema } from "@axata/axatalk-protocol";

import { assembleSdkSnapshotProductSections } from "./ExternalSdkSnapshotAssembler.js";
import type { SdkProductStateSnapshot } from "./ExternalSdkProductState.js";

function baseState(
  overrides: Partial<SdkProductStateSnapshot> = {},
): SdkProductStateSnapshot {
  return {
    signedIn: true,
    profileLabel: "Desk",
    registrationState: "registered",
    registrationReasonCode: null,
    calls: [
      {
        callId: "call_test_001",
        state: "Ringing",
        direction: "inbound",
        remoteNumber: "+15551237890",
        remoteDisplayName: "Alice",
        muted: false,
      },
    ],
    ocpEnabled: false,
    ocpConnected: false,
    operatorStatus: null,
    operatorReasonId: null,
    operatorReasonLabelKey: null,
    ...overrides,
  };
}

describe("ExternalSdkSnapshotAssembler", () => {
  it("redacts PII and omits operator when OCP disabled", () => {
    const sections = assembleSdkSnapshotProductSections(baseState());
    expect(sections.operator).toBeUndefined();
    expect(sections.calls[0]).toMatchObject({
      remoteNumber: "+*******7890",
      remoteDisplayName: "A***",
    });
    const merged = SnapshotSectionsSchema.safeParse({
      session: {
        clientId: "client_test_001",
        grantedCapabilities: ["session.read.redacted"],
        authenticated: true,
      },
      ...sections,
      window: { visible: true },
    });
    expect(merged.success).toBe(true);
  });

  it("includes operator when OCP enabled without fabricating tokens", () => {
    const sections = assembleSdkSnapshotProductSections(
      baseState({ ocpEnabled: true, ocpConnected: false }),
    );
    expect(sections.operator).toEqual({ connected: false });
    expect(JSON.stringify(sections)).not.toMatch(/apiKey|ocpAuthToken|password/i);
  });
});

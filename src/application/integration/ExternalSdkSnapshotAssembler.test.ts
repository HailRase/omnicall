import { describe, expect, it } from "vitest";
import { SnapshotSectionsSchema } from "@softomnitel/omnicall-protocol";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";

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
        queueLabel: null,
        acdContext: null,
      },
    ],
    ocpEnabled: false,
    ocpConnected: false,
    operatorStatus: null,
    operatorReasonId: null,
    operatorReasonLabelKey: null,
    reservedStatus: null,
    reservedReasonId: null,
    activeCampaign: null,
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

  it("projects post_call_processing for finish-appeal visibility", () => {
    const sections = assembleSdkSnapshotProductSections(
      baseState({
        ocpEnabled: true,
        ocpConnected: true,
        operatorStatus: OperatorStatus.POST_CALL_PROCESSING,
        operatorReasonId: 5,
        operatorReasonLabelKey: "ocp.operatorStatus.postCallProcessing",
      }),
    );
    expect(sections.operator).toEqual({
      connected: true,
      status: "post_call_processing",
      reasonId: 5,
      reasonLabelKey: "ocp.operatorStatus.postCallProcessing",
    });
    const merged = SnapshotSectionsSchema.safeParse({
      session: {
        clientId: "client_test_001",
        grantedCapabilities: ["session.read.redacted", "operator.status.write"],
        authenticated: true,
      },
      ...sections,
      window: { visible: true },
    });
    expect(merged.success).toBe(true);
  });

  it("includes additive queueLabel on call summary without OCP wire ids", () => {
    const sections = assembleSdkSnapshotProductSections(
      baseState({
        calls: [
          {
            callId: "call_test_001",
            state: "Ringing",
            direction: "inbound",
            remoteNumber: "+15551237890",
            remoteDisplayName: "Alice",
            muted: false,
            queueLabel: "Support ACD",
            acdContext: null,
          },
        ],
      }),
    );
    expect(sections.calls[0]).toMatchObject({
      callId: "call_test_001",
      queueLabel: "Support ACD",
    });
    expect(JSON.stringify(sections.calls)).not.toMatch(/acall/i);
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

  it("includes acdContext wire on call summary for reconnect", () => {
    const sections = assembleSdkSnapshotProductSections(
      baseState({
        calls: [
          {
            callId: "call_test_001",
            state: "Ringing",
            direction: "inbound",
            remoteNumber: "+15551237890",
            remoteDisplayName: "Alice",
            muted: false,
            queueLabel: "Support ACD",
            acdContext: {
              mainAcallId: "main-1",
              acallId: "acall-1",
              event: "incomingCallProgress",
              callerId: "37500508954",
              calledId: "op.test",
              queue: "Support ACD",
              userLogin: "op.test",
              phase: "progress",
            },
          },
        ],
      }),
    );
    expect(sections.calls[0]).toMatchObject({
      queueLabel: "Support ACD",
      acdContext: {
        main_acallid: "main-1",
        acallid: "acall-1",
        user_login: "op.test",
        queue: "Support ACD",
      },
    });
  });

  it("includes redacted operator.campaign when activeCampaign is set", () => {
    const sections = assembleSdkSnapshotProductSections(
      baseState({
        ocpEnabled: true,
        ocpConnected: true,
        operatorStatus: OperatorStatus.READY,
        operatorReasonId: 1,
        operatorReasonLabelKey: "ocp.operatorStatus.ready",
        activeCampaign: {
          campaignId: "camp_snap_001",
          progressive: false,
          clientPhone: "+15551237890",
          companyTitle: "Acme",
          strategyTitle: "Strat",
          selectionTitle: "Sel",
          queueTitle: "Support",
        },
      }),
    );
    expect(sections.operator).toMatchObject({
      connected: true,
      campaign: {
        campaignId: "camp_snap_001",
        mode: "preview",
        remoteNumber: "+*******7890",
        companyLabel: "Acme",
        queueLabel: "Support",
      },
    });
  });

  it("projects reservedTarget while busy without changing coarse status", () => {
    const sections = assembleSdkSnapshotProductSections(
      baseState({
        ocpEnabled: true,
        ocpConnected: true,
        operatorStatus: OperatorStatus.TALKING,
        operatorReasonId: 4,
        operatorReasonLabelKey: "ocp.operatorStatus.talking",
        reservedStatus: OperatorStatus.BREAK,
        reservedReasonId: 7,
      }),
    );
    expect(sections.operator).toEqual({
      connected: true,
      status: "unknown",
      reasonId: 4,
      reasonLabelKey: "ocp.operatorStatus.talking",
      reservedTarget: "break",
      reservedReasonId: 7,
    });
    const merged = SnapshotSectionsSchema.safeParse({
      session: {
        clientId: "client_test_001",
        grantedCapabilities: ["session.read.redacted", "operator.status.write"],
        authenticated: true,
      },
      ...sections,
      window: { visible: true },
    });
    expect(merged.success).toBe(true);
  });
});

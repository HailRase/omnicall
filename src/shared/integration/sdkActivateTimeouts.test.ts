import { describe, expect, it } from "vitest";
import { SDK_ACTIVATE_CLIENT_TIMEOUT_MS } from "@axata/axatalk-protocol";
import { OCP_SIGN_IN_STAGE_TIMEOUT_MS } from "@domain/integration/ocp/OcpSignInProgress.js";

import {
  SDK_ACTIVATE_BROKER_TIMEOUT_MS,
  SDK_ACTIVATE_CONSENT_TTL_MS,
  SDK_ACTIVATE_OCP_AUTH_BUDGET_MS,
  SDK_ACTIVATE_OCP_AUTH_SLACK_MS,
  SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS,
  brokerTimeoutMsForCommand,
  releasesSdkInboundQueueWhilePending,
  sdkActivateAuthBudgetMs,
} from "./sdkActivateTimeouts.js";

describe("sdkActivateTimeouts (shared)", () => {
  it("derives OCP auth budget from domain stage timeouts + slack", () => {
    const stageSum = (
      Object.values(OCP_SIGN_IN_STAGE_TIMEOUT_MS) as readonly number[]
    ).reduce((sum, ms) => sum + ms, 0);
    expect(SDK_ACTIVATE_OCP_AUTH_BUDGET_MS).toBe(
      stageSum + SDK_ACTIVATE_OCP_AUTH_SLACK_MS,
    );
    expect(SDK_ACTIVATE_OCP_AUTH_BUDGET_MS).toBe(115_000);
  });

  it("aligns broker hop with protocol client timeout (max Settings consent)", () => {
    expect(SDK_ACTIVATE_BROKER_TIMEOUT_MS).toBe(SDK_ACTIVATE_CLIENT_TIMEOUT_MS);
    expect(SDK_ACTIVATE_BROKER_TIMEOUT_MS).toBe(420_000);
    // Default-consent hop stays shorter; correlator uses max consent ceiling.
    expect(
      SDK_ACTIVATE_CONSENT_TTL_MS +
        Math.max(
          SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS,
          SDK_ACTIVATE_OCP_AUTH_BUDGET_MS,
        ) +
        5_000,
    ).toBe(240_000);
    expect(SDK_ACTIVATE_BROKER_TIMEOUT_MS).toBeGreaterThan(240_000);
  });

  it("selects auth budget by mode", () => {
    expect(sdkActivateAuthBudgetMs("ocp")).toBe(SDK_ACTIVATE_OCP_AUTH_BUDGET_MS);
    expect(sdkActivateAuthBudgetMs("sip_only")).toBe(
      SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS,
    );
  });

  it("uses long timeout only for activate-profile", () => {
    expect(brokerTimeoutMsForCommand("account:activate-profile", 5_000)).toBe(
      SDK_ACTIVATE_BROKER_TIMEOUT_MS,
    );
    expect(brokerTimeoutMsForCommand("sdk:ping", 5_000)).toBe(5_000);
    expect(brokerTimeoutMsForCommand("call:originate", 100)).toBe(100);
  });

  it("detaches only activate-profile from inbound queue while pending", () => {
    expect(releasesSdkInboundQueueWhilePending("account:activate-profile")).toBe(
      true,
    );
    expect(releasesSdkInboundQueueWhilePending("sdk:ping")).toBe(false);
    expect(releasesSdkInboundQueueWhilePending("sdk:get-snapshot")).toBe(false);
    expect(releasesSdkInboundQueueWhilePending("sdk:auth-proof")).toBe(false);
  });
});

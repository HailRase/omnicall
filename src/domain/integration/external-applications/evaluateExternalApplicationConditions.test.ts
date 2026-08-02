import { describe, expect, it } from "vitest";
import { createSettingsAccountKey } from "../../settings/SettingsAccountKey.js";
import type { ExternalServiceTriggerContext } from "../external-services/template/buildExternalServiceVariables.js";
import { DEFAULT_EXTERNAL_APPLICATION_CONDITIONS } from "./ExternalApplicationsSettings.js";
import { evaluateExternalApplicationConditions } from "./evaluateExternalApplicationConditions.js";

function trigger(
  overrides: Partial<ExternalServiceTriggerContext> = {},
): ExternalServiceTriggerContext {
  return {
    eventType: "incoming_ringing",
    occurredAt: "2026-07-31T12:00:00.000Z",
    profileKey: createSettingsAccountKey("user@example.test"),
    callId: "call-1",
    callerId: "1001",
    callDirection: "inbound",
    ...overrides,
  };
}

describe("evaluateExternalApplicationConditions", () => {
  it("allows defaults for any trigger", () => {
    expect(
      evaluateExternalApplicationConditions(
        DEFAULT_EXTERNAL_APPLICATION_CONDITIONS,
        trigger(),
      ),
    ).toEqual({ ok: true });
  });

  it("rejects direction mismatch and missing direction", () => {
    expect(
      evaluateExternalApplicationConditions(
        { ...DEFAULT_EXTERNAL_APPLICATION_CONDITIONS, callDirection: "outbound" },
        trigger({ callDirection: "inbound" }),
      ),
    ).toEqual({ ok: false, reason: "direction_mismatch" });
    expect(
      evaluateExternalApplicationConditions(
        { ...DEFAULT_EXTERNAL_APPLICATION_CONDITIONS, callDirection: "inbound" },
        trigger({ callDirection: undefined }),
      ),
    ).toEqual({ ok: false, reason: "missing_direction" });
  });

  it("matches any listed queue name case-insensitively", () => {
    const conditions = {
      ...DEFAULT_EXTERNAL_APPLICATION_CONDITIONS,
      queueNames: ["Sales", "Support"],
    };
    expect(
      evaluateExternalApplicationConditions(
        conditions,
        trigger({ acd: { queue_name: "support" } }),
      ),
    ).toEqual({ ok: true });
    expect(
      evaluateExternalApplicationConditions(
        conditions,
        trigger({ campaign: { queue_name: "Billing" } }),
      ),
    ).toEqual({ ok: false, reason: "queue_mismatch" });
    expect(
      evaluateExternalApplicationConditions(conditions, trigger()),
    ).toEqual({ ok: false, reason: "missing_queue" });
  });
});

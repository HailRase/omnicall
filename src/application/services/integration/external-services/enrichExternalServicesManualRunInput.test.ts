import { describe, expect, it } from "vitest";
import {
  createSettingsAccountKey,
  type ExternalServiceCollectionId,
  type ExternalServiceRequestId,
} from "@domain/index.js";
import {
  EXTERNAL_SERVICES_TEST_COLLECTION_ID,
  EXTERNAL_SERVICES_TEST_REQUEST_ID,
} from "./externalServicesTestFixtures.js";
import type { RunExternalServiceRequestNowInput } from "../../../use-cases/integration/RunExternalServiceRequestNowUseCase.js";
import { enrichExternalServicesManualRunInput } from "./enrichExternalServicesManualRunInput.js";

const baseInput: RunExternalServiceRequestNowInput = {
  collectionId: EXTERNAL_SERVICES_TEST_COLLECTION_ID as ExternalServiceCollectionId,
  requestId: EXTERNAL_SERVICES_TEST_REQUEST_ID as ExternalServiceRequestId,
  expectedSettingsRevision: 1,
  profileKey: createSettingsAccountKey("agent@pbx.example"),
  occurredAt: "2026-08-01T12:00:00.000Z",
  userLogin: "agent",
  focusedCallContext: { callId: "call-1" },
};

describe("enrichExternalServicesManualRunInput", () => {
  it("returns input unchanged when no tracked call matches", () => {
    expect(enrichExternalServicesManualRunInput(baseInput, null)).toEqual(baseInput);
  });

  it("fills focused-call parties from the tracker without dropping caller login", () => {
    expect(
      enrichExternalServicesManualRunInput(baseInput, {
        callId: "call-1",
        callerId: "7900",
        calledId: "agent",
        direction: "inbound",
        userLogin: "tracked-agent",
      }),
    ).toEqual({
      ...baseInput,
      focusedCallContext: {
        callId: "call-1",
        callerId: "7900",
        calledId: "agent",
        callDirection: "inbound",
      },
    });
  });
});

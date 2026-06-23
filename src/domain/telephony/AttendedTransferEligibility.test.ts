import { describe, expect, it } from "vitest";
import {
  createIncomingCall,
  createOutgoingCall,
  createCallId,
  createPhoneNumber,
  createTransferSession,
} from "@domain/index.js";
import {
  evaluateCompleteAttendedTransferEligibility,
  evaluateStartConsultationEligibility,
} from "./AttendedTransferEligibility.js";

describe("AttendedTransferEligibility", () => {
  it("allows consultation when multi-sessions enabled", () => {
    const sourceCall = createOutgoingCall(
      createCallId("src-1"),
      createPhoneNumber("+12025550600"),
    );
    const activeSource = { ...sourceCall, state: "Active" as const };
    const result = evaluateStartConsultationEligibility({
      sourceCall: activeSource,
      transferSession: null,
      multiCallSettings: { multiSessionsEnabled: true },
      targetNumber: "+12025550601",
    });
    expect(result.ok).toBe(true);
  });

  it("blocks consultation when multi-sessions disabled (LF-032)", () => {
    const sourceCall = createOutgoingCall(
      createCallId("src-2"),
      createPhoneNumber("+12025550602"),
    );
    const result = evaluateStartConsultationEligibility({
      sourceCall: { ...sourceCall, state: "Active" },
      transferSession: null,
      multiCallSettings: { multiSessionsEnabled: false },
      targetNumber: "+12025550603",
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.reason).toBe("second_session_disabled");
  });

  it("blocks consultation when session already in progress", () => {
    const sourceCall = createOutgoingCall(
      createCallId("src-3"),
      createPhoneNumber("+12025550604"),
    );
    const session = createTransferSession(
      createCallId("src-3"),
      createPhoneNumber("+12025550605"),
      createCallId("consult-3"),
    );
    const result = evaluateStartConsultationEligibility({
      sourceCall: { ...sourceCall, state: "Held" },
      transferSession: session,
      multiCallSettings: { multiSessionsEnabled: true },
      targetNumber: "+12025550606",
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.reason).toBe("consultation_in_progress");
  });

  it("allows complete attended transfer when consultation active", () => {
    const sourceCall = { ...createIncomingCall(createCallId("src-4"), createPhoneNumber("+1")), state: "Held" as const };
    const consultationCall = {
      ...createOutgoingCall(createCallId("consult-4"), createPhoneNumber("+12025550607")),
      state: "Active" as const,
    };
    const session = {
      ...createTransferSession(
        createCallId("src-4"),
        createPhoneNumber("+12025550607"),
        createCallId("consult-4"),
      ),
      phase: "consultation_active" as const,
    };
    const result = evaluateCompleteAttendedTransferEligibility({
      sourceCall,
      consultationCall,
      transferSession: session,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects complete when consultation not active", () => {
    const sourceCall = { ...createOutgoingCall(createCallId("src-5"), createPhoneNumber("+1")), state: "Held" as const };
    const consultationCall = {
      ...createOutgoingCall(createCallId("consult-5"), createPhoneNumber("+2")),
      state: "Connecting" as const,
    };
    const session = createTransferSession(
      createCallId("src-5"),
      createPhoneNumber("+2"),
      createCallId("consult-5"),
    );
    const result = evaluateCompleteAttendedTransferEligibility({
      sourceCall,
      consultationCall,
      transferSession: session,
    });
    expect(result.ok).toBe(false);
  });

  it("allows complete attended transfer retry after gateway failure phase", () => {
    const sourceCall = { ...createOutgoingCall(createCallId("src-6"), createPhoneNumber("+1")), state: "Held" as const };
    const consultationCall = {
      ...createOutgoingCall(createCallId("consult-6"), createPhoneNumber("+2")),
      state: "Active" as const,
    };
    const session = {
      ...createTransferSession(createCallId("src-6"), createPhoneNumber("+2"), createCallId("consult-6")),
      phase: "attended_transfer_failed" as const,
    };
    const result = evaluateCompleteAttendedTransferEligibility({
      sourceCall,
      consultationCall,
      transferSession: session,
    });
    expect(result.ok).toBe(true);
  });
});

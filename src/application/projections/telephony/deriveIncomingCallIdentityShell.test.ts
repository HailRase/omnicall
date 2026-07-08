import { createContact } from "@domain/settings/Contact.js";
import { createContactId } from "@domain/settings/ContactId.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { describe, expect, it } from "vitest";
import { deriveIncomingCallControlLine } from "./deriveIncomingCallControlLine.js";
import { deriveIncomingCallIdentityShell } from "./deriveIncomingCallIdentityShell.js";
import {
  initialIncomingCallProjection,
  reduceIncomingCallProjection,
} from "./incomingCallProjection.js";

function buildContact(id: string, displayName: string, primaryPhone: string) {
  const contactId = createContactId(id);
  if (contactId === null) {
    throw new Error("invalid contact id");
  }
  const created = createContact({ displayName, primaryPhone }, { id: contactId });
  if (!created.ok) {
    throw new Error("invalid contact");
  }
  return created.value;
}

function ringingIncomingProjection(callId: string, phoneNumber: string, displayName: string | null) {
  const correlationId = createCorrelationId();
  const received = reduceIncomingCallProjection(initialIncomingCallProjection(), {
    type: "IncomingCallReceived",
    correlationId,
    occurredAt: new Date().toISOString(),
    callId,
    phoneNumber,
    direction: "incoming",
    ...(displayName !== null ? { displayName } : {}),
  });
  return reduceIncomingCallProjection(received, {
    type: "IncomingCallRingingStarted",
    correlationId,
    occurredAt: new Date().toISOString(),
    callId,
    autoAnswerTimeoutSec: null,
    autoAnswerExpiresAt: null,
  });
}

describe("deriveIncomingCallIdentityShell", () => {
  it("prefers contact display name over SIP label", () => {
    const projection = ringingIncomingProjection("call-in", "+12025550100", "SIP Alice");
    const identity = deriveIncomingCallIdentityShell({
      projection,
      contacts: [buildContact("agent-a", "Alice Agent", "+12025550100")],
    });

    expect(identity.displayName).toBe("Alice Agent");
    expect(identity.callerNumber).toBe("+12025550100");
    expect(identity.presentationSource).toBe("contact");
  });
});

describe("deriveIncomingCallControlLine", () => {
  it("uses the same enriched display name as identity shell", () => {
    const projection = ringingIncomingProjection("call-in", "+12025550100", "SIP Alice");
    const contacts = [buildContact("agent-a", "Alice Agent", "+12025550100")];
    const identity = deriveIncomingCallIdentityShell({ projection, contacts });
    const line = deriveIncomingCallControlLine({ projection, contacts });

    expect(line?.displayName).toBe(identity.displayName);
    expect(line?.displayName).toBe("Alice Agent");
  });

  it("falls back to caller number when no contact or SIP label exists", () => {
    const projection = ringingIncomingProjection("call-in", "+12025550999", null);
    const line = deriveIncomingCallControlLine({ projection, contacts: [] });

    expect(line?.displayName).toBe("+12025550999");
  });
});

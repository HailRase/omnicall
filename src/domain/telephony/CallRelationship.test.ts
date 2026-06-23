import { describe, expect, it } from "vitest";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import {
  createTransferSession,
  isTransferSessionBlockingSecondConsultation,
  transitionTransferSession,
} from "./CallRelationship.js";

describe("CallRelationship", () => {
  it("creates session in consultation_dialing phase", () => {
    const session = createTransferSession(
      createCallId("source-1"),
      createPhoneNumber("+12025550500"),
      createCallId("consult-1"),
    );
    expect(session.phase).toBe("consultation_dialing");
    expect(session.consultationCallId).toBe("consult-1");
  });

  it("transitions to consultation_active", () => {
    const session = createTransferSession(
      createCallId("source-2"),
      createPhoneNumber("+12025550501"),
      createCallId("consult-2"),
    );
    const result = transitionTransferSession(session, "consultation_started", createCallId("consult-2"));
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.session?.phase).toBe("consultation_active");
  });

  it("rejects attended transfer when consultation not active", () => {
    const session = createTransferSession(
      createCallId("source-3"),
      createPhoneNumber("+12025550502"),
      createCallId("consult-3"),
    );
    const result = transitionTransferSession(session, "attended_transfer_requested");
    expect(result.ok).toBe(false);
  });

  it("clears session on attended transfer completed", () => {
    let session = createTransferSession(
      createCallId("source-4"),
      createPhoneNumber("+12025550503"),
      createCallId("consult-4"),
    );
    const started = transitionTransferSession(session, "consultation_started", createCallId("consult-4"));
    if (!started.ok || started.session === null) {
      throw new Error("expected consultation started");
    }
    session = started.session;
    const requested = transitionTransferSession(session, "attended_transfer_requested");
    if (!requested.ok || requested.session === null) {
      throw new Error("expected attended requested");
    }
    session = requested.session;
    const completed = transitionTransferSession(session, "attended_transfer_completed");
    expect(completed.ok).toBe(true);
    if (!completed.ok) {
      return;
    }
    expect(completed.session).toBeNull();
  });

  it("blocks second consultation while session in progress", () => {
    const session = createTransferSession(
      createCallId("source-5"),
      createPhoneNumber("+12025550504"),
      createCallId("consult-5"),
    );
    expect(isTransferSessionBlockingSecondConsultation(session)).toBe(true);
    expect(isTransferSessionBlockingSecondConsultation(null)).toBe(false);
  });

  it("transitions from attended_transfer_in_progress to attended_transfer_failed", () => {
    let session = createTransferSession(
      createCallId("source-6"),
      createPhoneNumber("+12025550505"),
      createCallId("consult-6"),
    );
    const started = transitionTransferSession(session, "consultation_started", createCallId("consult-6"));
    if (!started.ok || started.session === null) {
      throw new Error("expected consultation started");
    }
    session = started.session;
    const requested = transitionTransferSession(session, "attended_transfer_requested");
    if (!requested.ok || requested.session === null) {
      throw new Error("expected attended requested");
    }
    session = requested.session;
    const failed = transitionTransferSession(session, "attended_transfer_failed");
    expect(failed.ok).toBe(true);
    if (!failed.ok) {
      return;
    }
    expect(failed.session?.phase).toBe("attended_transfer_failed");
  });

  it("allows attended transfer retry from attended_transfer_failed phase", () => {
    let session = createTransferSession(
      createCallId("source-7"),
      createPhoneNumber("+12025550506"),
      createCallId("consult-7"),
    );
    const started = transitionTransferSession(session, "consultation_started", createCallId("consult-7"));
    if (!started.ok || started.session === null) {
      throw new Error("expected consultation started");
    }
    session = started.session;
    const requested = transitionTransferSession(session, "attended_transfer_requested");
    if (!requested.ok || requested.session === null) {
      throw new Error("expected attended requested");
    }
    session = requested.session;
    const failed = transitionTransferSession(session, "attended_transfer_failed");
    if (!failed.ok || failed.session === null) {
      throw new Error("expected attended failed");
    }
    session = failed.session;
    const retry = transitionTransferSession(session, "attended_transfer_requested");
    expect(retry.ok).toBe(true);
    if (!retry.ok) {
      return;
    }
    expect(retry.session?.phase).toBe("attended_transfer_in_progress");
  });

  it("blocks second consultation during attended_transfer_failed phase", () => {
    let session = createTransferSession(
      createCallId("source-8"),
      createPhoneNumber("+12025550507"),
      createCallId("consult-8"),
    );
    const started = transitionTransferSession(session, "consultation_started", createCallId("consult-8"));
    if (!started.ok || started.session === null) {
      throw new Error("expected consultation started");
    }
    session = started.session;
    const requested = transitionTransferSession(session, "attended_transfer_requested");
    if (!requested.ok || requested.session === null) {
      throw new Error("expected attended requested");
    }
    session = requested.session;
    const failed = transitionTransferSession(session, "attended_transfer_failed");
    if (!failed.ok || failed.session === null) {
      throw new Error("expected attended failed");
    }
    expect(isTransferSessionBlockingSecondConsultation(failed.session)).toBe(true);
  });

  it("rejects attended_transfer_failed from invalid phase", () => {
    const session = createTransferSession(
      createCallId("source-9"),
      createPhoneNumber("+12025550508"),
      createCallId("consult-9"),
    );
    const result = transitionTransferSession(session, "attended_transfer_failed");
    expect(result.ok).toBe(false);
  });
});

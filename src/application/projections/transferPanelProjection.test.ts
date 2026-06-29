import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
} from "./multiLineCallProjection.js";
import {
  initialTransferProjection,
  reduceTransferProjection,
} from "./transferProjection.js";
import { resolveTransferFailureMessage, resolveTransferFailureBanner, isTransferPanelVisible } from "./transferPanelProjection.js";

describe("transferPanelProjection", () => {
  it("does not show panel for two ordinary calls without transfer session", () => {
    const visible = isTransferPanelVisible(initialTransferProjection(), {
      attendedPhase: "idle",
      consultationCallId: null,
    });

    expect(visible).toBe(false);
  });

  it("shows panel when transfer mode is active", () => {
    const transfer = {
      ...initialTransferProjection(),
      transferModeActive: true,
      sourceCallId: "call-1",
    };

    expect(
      isTransferPanelVisible(transfer, {
        attendedPhase: "idle",
        consultationCallId: null,
      }),
    ).toBe(true);
  });

  it("returns null after cancel and re-entering transfer mode", () => {
    let transfer = reduceTransferProjection(initialTransferProjection(), {
      type: "TransferModeStarted",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "src-1",
    });
    let multiLine = reduceMultiLineCallProjection(initialMultiLineCallProjection(), {
      type: "ConsultationCallRequested",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-1",
      consultationCallId: "consult-1",
      targetNumber: "+12025550800",
    });
    multiLine = reduceMultiLineCallProjection(multiLine, {
      type: "ConsultationCallStarted",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-1",
      consultationCallId: "consult-1",
    });

    transfer = reduceTransferProjection(transfer, {
      type: "TransferModeCancelled",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "src-1",
      restoredSourceState: "Held",
      consultationCallId: "consult-1",
    });
    multiLine = reduceMultiLineCallProjection(multiLine, {
      type: "TransferModeCancelled",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "src-1",
      restoredSourceState: "Held",
      consultationCallId: "consult-1",
    });

    transfer = reduceTransferProjection(transfer, {
      type: "TransferModeStarted",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "src-1",
    });

    expect(
      resolveTransferFailureMessage(transfer, multiLine.lastFailureReason),
    ).toBeNull();
  });

  it("formats transfer failure banner copy", () => {
    const transfer = reduceTransferProjection(initialTransferProjection(), {
      type: "CallTransferFailed",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      callId: "src-2",
      targetNumber: "+12025550801",
      transferType: "blind",
      reason: "REFER rejected",
    });

    expect(resolveTransferFailureMessage(transfer, null)).toBe(
      "Ошибка перевода: REFER rejected",
    );
    expect(resolveTransferFailureBanner(transfer, null)).toEqual({
      title: "Ошибка перевода",
      detail: "REFER rejected",
    });
  });

  it("formats consultation failure banner copy", () => {
    const transfer = reduceTransferProjection(initialTransferProjection(), {
      type: "ConsultationCallFailed",
      correlationId: createCorrelationId(),
      occurredAt: new Date().toISOString(),
      sourceCallId: "src-3",
      consultationCallId: "consult-3",
      reason: "busy",
      restoredSourceState: "Held",
    });

    expect(resolveTransferFailureMessage(transfer, "busy")).toBe(
      "Ошибка консультации: busy",
    );
  });

  it("ignores benign transfer_cancelled reason", () => {
    const transfer = {
      ...initialTransferProjection(),
      lastFailureReason: "transfer_cancelled",
    };

    expect(resolveTransferFailureMessage(transfer, "transfer_cancelled")).toBeNull();
  });
});

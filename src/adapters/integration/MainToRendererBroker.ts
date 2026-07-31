/**
 * Real MainToRendererBrokerPort (DI-02 / ADR-0009).
 * Owns readiness, pending correlation, timeout, reload, and shutdown.
 * Transport is injected — Electron wiring lives in main registration.
 */

import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@softomnitel/omnicall-protocol";
import type {
  BrokerRequestResult,
  MainToRendererBrokerPort,
} from "@ports/integration/MainToRendererBrokerPort.js";
import type { SdkBrokerRequestIpcPayload } from "@shared/ipc/SdkBrokerContract.js";
import { parseSdkBrokerReplyIpcPayload } from "@shared/ipc/SdkBrokerContract.js";

import {
  nextBrokerRequestId,
  toProductRequest,
} from "./mainToRendererBrokerHelpers.js";
import { brokerTimeoutMsForCommand } from "@shared/integration/sdkActivateTimeouts.js";

/** Default product-request timeout across the IPC hop (ms). */
export const SDK_BROKER_DEFAULT_TIMEOUT_MS = 5_000;

export type MainToRendererBrokerTransport = Readonly<{
  /** Returns false when the renderer target is unavailable. */
  sendRequest: (payload: SdkBrokerRequestIpcPayload) => boolean;
}>;

export type MainToRendererBrokerOptions = Readonly<{
  transport: MainToRendererBrokerTransport;
  timeoutMs?: number;
  createBrokerRequestId?: () => string;
  onLog?: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
}>;

type PendingEntry = {
  readonly protocolRequestId: string;
  readonly resolve: (result: BrokerRequestResult) => void;
  readonly timer: ReturnType<typeof setTimeout>;
};

export class MainToRendererBroker implements MainToRendererBrokerPort {
  /** Last readiness claim from the renderer composition. */
  private compositionReady = false;
  /** True while quit/restart is in progress and may still be cancelled. */
  private pausedForShutdown = false;
  private accepting = true;
  private readonly pending = new Map<string, PendingEntry>();
  private readonly timeoutMs: number;
  private readonly createBrokerRequestId: () => string;
  private readonly transport: MainToRendererBrokerTransport;
  private readonly onLog:
    | ((
        event: string,
        fields: Readonly<Record<string, string | number | boolean>>,
      ) => void)
    | undefined;

  constructor(options: MainToRendererBrokerOptions) {
    this.transport = options.transport;
    this.timeoutMs = options.timeoutMs ?? SDK_BROKER_DEFAULT_TIMEOUT_MS;
    this.createBrokerRequestId =
      options.createBrokerRequestId ?? nextBrokerRequestId;
    this.onLog = options.onLog;
  }

  isReady(): boolean {
    return (
      this.accepting && this.compositionReady && !this.pausedForShutdown
    );
  }

  setReady(ready: boolean): void {
    if (!this.accepting) {
      return;
    }
    this.compositionReady = ready;
    this.onLog?.("sdk_broker_ready_changed", {
      ready,
      pausedForShutdown: this.pausedForShutdown,
      pendingCount: this.pending.size,
    });
  }

  /**
   * Renderer reload / navigation: clear readiness, reject pending with `not_ready`.
   * No mutation replay — callers must resync after ready returns.
   */
  notifyRendererReload(): void {
    this.compositionReady = false;
    this.rejectAllPending("not_ready", "reload");
  }

  /**
   * Quit/restart began: pause acceptance and cancel pending. Preserves the last
   * composition ready claim so `cancelAppShutdown()` can restore without a rebind.
   */
  beginAppShutdown(): void {
    this.pausedForShutdown = true;
    this.rejectAllPending("operation_failed", "shutdown");
    this.onLog?.("sdk_broker_shutdown_begun", {
      compositionReady: this.compositionReady,
      pendingCount: this.pending.size,
    });
  }

  /**
   * User cancelled quit/restart: resume product acceptance when composition was ready.
   */
  cancelAppShutdown(): void {
    if (!this.accepting) {
      return;
    }
    this.pausedForShutdown = false;
    this.onLog?.("sdk_broker_shutdown_cancelled", {
      compositionReady: this.compositionReady,
      pendingCount: this.pending.size,
    });
  }

  /**
   * Confirmed app quit / broker dispose: stop accepting and cancel any remaining pending.
   */
  shutdown(): void {
    this.accepting = false;
    this.compositionReady = false;
    this.pausedForShutdown = false;
    this.rejectAllPending("operation_failed", "shutdown");
  }

  /** Explicit cancel of one pending broker hop (tests / future gateway abort). */
  cancel(brokerRequestId: string): boolean {
    return this.settlePending(brokerRequestId, {
      ok: false,
      code: "operation_failed",
    });
  }

  getPendingCount(): number {
    return this.pending.size;
  }

  acceptReply(input: unknown): boolean {
    const parsed = parseSdkBrokerReplyIpcPayload(input);
    if (parsed === null) {
      this.onLog?.("sdk_broker_reply_rejected", {
        reason: "invalid_envelope",
      });
      return false;
    }

    if (!parsed.ok) {
      return this.settlePending(parsed.brokerRequestId, {
        ok: false,
        code: parsed.code,
        ...(parsed.currentRevision !== undefined
          ? { currentRevision: parsed.currentRevision }
          : {}),
        ...(parsed.details !== undefined ? { details: parsed.details } : {}),
      });
    }

    const validated = validateWireMessage(parsed.reply);
    if (!validated.success) {
      return this.settlePending(parsed.brokerRequestId, {
        ok: false,
        code: validated.code,
      });
    }

    if (validated.data.kind !== "reply") {
      return this.settlePending(parsed.brokerRequestId, {
        ok: false,
        code: "invalid_message",
      });
    }

    return this.settlePending(parsed.brokerRequestId, {
      ok: true,
      reply: validated.data,
    });
  }

  request(
    input: unknown,
    context?: { readonly clientId?: string; readonly origin?: string },
  ): Promise<BrokerRequestResult> {
    if (!this.accepting) {
      return Promise.resolve({ ok: false, code: "operation_failed" });
    }
    if (!this.compositionReady || this.pausedForShutdown) {
      return Promise.resolve({ ok: false, code: "not_ready" });
    }

    const validated = validateWireMessage(input);
    if (!validated.success) {
      return Promise.resolve({ ok: false, code: validated.code });
    }

    const message = validated.data;
    if (message.kind !== "command") {
      return Promise.resolve({ ok: false, code: "invalid_message" });
    }

    if (!isCommandAvailableInProductV1(message.type)) {
      const denial = productDenialCodeForCommand(message.type);
      return Promise.resolve({ ok: false, code: denial ?? "forbidden" });
    }

    const product = toProductRequest(message);
    const brokerRequestId = this.createBrokerRequestId();
    const clientId = context?.clientId;
    const origin = context?.origin;
    const sent = this.transport.sendRequest({
      brokerRequestId,
      command: message,
      ...(clientId !== undefined && clientId.length > 0
        ? { clientId }
        : {}),
      ...(origin !== undefined && origin.length > 0 ? { origin } : {}),
    });

    if (!sent) {
      this.onLog?.("sdk_broker_send_failed", {
        commandType: product.commandType,
        reason: "renderer_unavailable",
      });
      return Promise.resolve({ ok: false, code: "not_ready" });
    }

    return new Promise<BrokerRequestResult>((resolve) => {
      const timeoutMs = brokerTimeoutMsForCommand(
        product.commandType,
        this.timeoutMs,
      );
      const timer = setTimeout(() => {
        this.settlePending(brokerRequestId, { ok: false, code: "timeout" });
      }, timeoutMs);

      this.pending.set(brokerRequestId, {
        protocolRequestId: product.requestId,
        resolve,
        timer,
      });

      this.onLog?.("sdk_broker_request_sent", {
        commandType: product.commandType,
        pendingCount: this.pending.size,
        timeoutMs,
      });
    });
  }

  private settlePending(
    brokerRequestId: string,
    result: BrokerRequestResult,
  ): boolean {
    const entry = this.pending.get(brokerRequestId);
    if (entry === undefined) {
      return false;
    }
    this.pending.delete(brokerRequestId);
    clearTimeout(entry.timer);
    entry.resolve(result);
    this.onLog?.("sdk_broker_request_settled", {
      ok: result.ok,
      code: result.ok ? "ok" : result.code,
      pendingCount: this.pending.size,
    });
    return true;
  }

  private rejectAllPending(
    code: "not_ready" | "operation_failed",
    reason: "reload" | "shutdown",
  ): void {
    const ids = [...this.pending.keys()];
    for (const id of ids) {
      this.settlePending(id, { ok: false, code });
    }
    this.onLog?.("sdk_broker_pending_rejected", {
      reason,
      code,
      rejectedCount: ids.length,
    });
  }
}

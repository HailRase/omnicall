/**
 * Sole public aggregate revision authority for SDK mutations (ADR-0027 / WU-02).
 * - peek / expectedRevision → stale_state (no side effect)
 * - serialize revision-dependent mutations at one aggregate boundary
 * - advance once after successful mutation; reply.revision = post-success peek
 * - window show/hide join this clock (native BrowserWindow stays in main)
 * Domain stays free of this protocol clock.
 */

import type { ExternalHandlerResult } from "@ports/integration/ExternalCommandHandler.js";
import type { WireJsonObject } from "@softomnitel/omnicall-protocol";

import {
  readExpectedRevision,
  sdkCallStale,
  sdkCallSuccess,
  sdkFail,
} from "./externalSdkCallHelpers.js";
import { SdkAggregateMutex } from "./SdkAggregateMutex.js";
import { SdkSessionRevisionClock } from "./SdkSessionRevisionClock.js";

const AGGREGATE_KEY = "__sdk_session_revision__";

export type SdkRevisionMutationSuccess = Readonly<{
  ok: true;
  result: WireJsonObject;
  /** When false, return peek() without advance (idempotent reauth). Default true. */
  advance?: boolean;
}>;

export type SdkRevisionMutationOutcome =
  | SdkRevisionMutationSuccess
  | Extract<ExternalHandlerResult, { ok: false }>;

export type SdkSessionRevisionCoordinatorOptions = Readonly<{
  clock?: SdkSessionRevisionClock;
  mutex?: SdkAggregateMutex;
}>;

export type SdkRevisionReservation = Readonly<{
  id: number;
  expectedRevision: number;
}>;

/**
 * Application integration façade over clock + aggregate mutex.
 */
export class SdkSessionRevisionCoordinator {
  private readonly clock: SdkSessionRevisionClock;
  private readonly mutex: SdkAggregateMutex;
  private nextReservationId = 1;
  private reservation: SdkRevisionReservation | undefined;

  constructor(options: SdkSessionRevisionCoordinatorOptions = {}) {
    this.clock = options.clock ?? new SdkSessionRevisionClock();
    this.mutex = options.mutex ?? new SdkAggregateMutex();
  }

  /** Current aggregate revision (no side effect). */
  peek(): number {
    return this.clock.peek();
  }

  /**
   * Aggregate serialization without revision validate/advance.
   * Prefer `runMutation` for revision-dependent command paths.
   */
  runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    return this.mutex.runExclusive(AGGREGATE_KEY, operation);
  }

  /**
   * Serialize a read observation with mutations without exposing mutable revision state.
   */
  observe<T>(read: (revision: number) => T | Promise<T>): Promise<T> {
    return this.runExclusive(() => Promise.resolve(read(this.clock.peek())));
  }

  /**
   * Serialize event revision decisions with mutations. Only this coordinator advances.
   */
  runEventPublication<T>(
    publish: (currentRevision: number, advance: () => number) => T,
  ): Promise<T> {
    return this.runExclusive(() =>
      Promise.resolve(publish(this.clock.peek(), () => this.clock.advance())),
    );
  }

  /**
   * Validate expectedRevision under the aggregate lock, run mutate, advance on success.
   */
  runMutation(
    expectedRevision: number,
    mutate: () => Promise<SdkRevisionMutationOutcome>,
  ): Promise<ExternalHandlerResult> {
    return this.runExclusive(async () => {
      const current = this.clock.peek();
      if (expectedRevision !== current) {
        return sdkCallStale(current);
      }
      const outcome = await mutate();
      if (!outcome.ok) {
        return outcome;
      }
      const revision =
        outcome.advance === false ? this.clock.peek() : this.clock.advance();
      return sdkCallSuccess(outcome.result, revision);
    });
  }

  /**
   * Reserve one expected revision without retaining the aggregate lock while an
   * interaction is pending. A later commit must prove that the reservation and
   * revision are still current before running its single mutation.
   */
  reserveMutation(expectedRevision: number): Promise<
    SdkRevisionReservation | Extract<ExternalHandlerResult, { ok: false }>
  > {
    return this.runExclusive(() => {
      type ReservationResult =
        | SdkRevisionReservation
        | Extract<ExternalHandlerResult, { ok: false }>;
      const current = this.clock.peek();
      if (expectedRevision !== current) {
        return Promise.resolve<ReservationResult>(sdkCallStale(current));
      }
      if (this.reservation !== undefined) {
        return Promise.resolve<ReservationResult>(sdkFail("conflict"));
      }
      const reservation = {
        id: this.nextReservationId,
        expectedRevision,
      };
      this.nextReservationId += 1;
      this.reservation = reservation;
      return Promise.resolve<ReservationResult>(reservation);
    });
  }

  cancelReservation(reservation: SdkRevisionReservation): Promise<void> {
    return this.runExclusive(() => {
      if (this.isCurrentReservation(reservation)) {
        this.reservation = undefined;
      }
      return Promise.resolve();
    });
  }

  commitReservation(
    reservation: SdkRevisionReservation,
    mutate: () => Promise<SdkRevisionMutationOutcome>,
  ): Promise<ExternalHandlerResult> {
    return this.runExclusive(async () => {
      if (!this.isCurrentReservation(reservation)) {
        return sdkFail("operation_failed");
      }
      const current = this.clock.peek();
      if (current !== reservation.expectedRevision) {
        this.reservation = undefined;
        return sdkCallStale(current);
      }
      this.reservation = undefined;
      const outcome = await mutate();
      if (!outcome.ok) {
        return outcome;
      }
      const revision =
        outcome.advance === false ? this.clock.peek() : this.clock.advance();
      return sdkCallSuccess(outcome.result, revision);
    });
  }

  /**
   * Read `expectedRevision` from payload then `runMutation`.
   */
  runMutationFromPayload(
    payload: unknown,
    mutate: () => Promise<SdkRevisionMutationOutcome>,
  ): Promise<ExternalHandlerResult> {
    const expectedRevision = readExpectedRevision(payload);
    if (expectedRevision === null) {
      return Promise.resolve(sdkFail("invalid_payload"));
    }
    return this.runMutation(expectedRevision, mutate);
  }

  /**
   * Serialize + advance without expectedRevision (window:show — empty payload).
   * Still one public clock; no second revision owner.
   */
  runSerializedMutation(
    mutate: () => Promise<SdkRevisionMutationOutcome>,
  ): Promise<ExternalHandlerResult> {
    return this.runExclusive(async () => {
      const outcome = await mutate();
      if (!outcome.ok) {
        return outcome;
      }
      const revision =
        outcome.advance === false ? this.clock.peek() : this.clock.advance();
      return sdkCallSuccess(outcome.result, revision);
    });
  }

  private isCurrentReservation(reservation: SdkRevisionReservation): boolean {
    return (
      this.reservation?.id === reservation.id &&
      this.reservation.expectedRevision === reservation.expectedRevision
    );
  }
}

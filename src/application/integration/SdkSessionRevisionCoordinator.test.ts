/**
 * WU-01 / ADR-0027 — aggregate revision coordinator (product mutations).
 */

import { describe, expect, it } from "vitest";

import { SdkSessionRevisionCoordinator } from "./SdkSessionRevisionCoordinator.js";

describe("SdkSessionRevisionCoordinator", () => {
  it("returns stale_state without side effect on expectedRevision mismatch", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    let mutated = false;
    const result = await coordinator.runMutation(99, () => {
      mutated = true;
      return Promise.resolve({ ok: true, result: { accepted: true } });
    });
    expect(result).toEqual({
      ok: false,
      code: "stale_state",
      retryable: false,
      currentRevision: 1,
    });
    expect(mutated).toBe(false);
    expect(coordinator.peek()).toBe(1);
  });

  it("advances once on success and sets reply.revision to post-success peek", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const result = await coordinator.runMutation(1, () => Promise.resolve({
      ok: true,
      result: { accepted: true },
    }));
    expect(result).toEqual({
      ok: true,
      result: { accepted: true },
      revision: 2,
    });
    expect(coordinator.peek()).toBe(2);
  });

  it("does not advance when mutate fails", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const result = await coordinator.runMutation(1, () => Promise.resolve({
      ok: false,
      code: "operation_failed",
      retryable: false,
    }));
    expect(result.ok).toBe(false);
    expect(coordinator.peek()).toBe(1);
  });

  it("supports advance:false success (idempotent reauth)", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const result = await coordinator.runMutation(1, () => Promise.resolve({
      ok: true,
      advance: false,
      result: { alreadyAuthenticated: true },
    }));
    expect(result).toEqual({
      ok: true,
      result: { alreadyAuthenticated: true },
      revision: 1,
    });
    expect(coordinator.peek()).toBe(1);
  });

  it("serializes concurrent multi-client mutations monotonically", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const order: number[] = [];
    let started = 0;

    const runClient = async (client: number, expected: number) => {
      return coordinator.runMutation(expected, async () => {
        started += 1;
        const gate = started;
        await Promise.resolve();
        order.push(client);
        expect(gate).toBe(order.length);
        return { ok: true, result: { client } };
      });
    };

    // Client B must observe A's post-success revision (serialize + monotonic).
    const first = runClient(1, 1);
    await Promise.resolve();
    const secondPromise = first.then((a) => {
      expect(a.ok).toBe(true);
      if (!a.ok || a.revision === undefined) {
        return a;
      }
      return runClient(2, a.revision);
    });

    const [a, b] = await Promise.all([first, secondPromise]);
    expect(a).toMatchObject({ ok: true, revision: 2, result: { client: 1 } });
    expect(b).toMatchObject({ ok: true, revision: 3, result: { client: 2 } });
    expect(order).toEqual([1, 2]);
    expect(coordinator.peek()).toBe(3);
  });

  it("rejects concurrent stale expectedRevision while another mutation holds the lock", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = coordinator.runMutation(1, async () => {
      await firstGate;
      return { ok: true, result: { step: "a" } };
    });

    await Promise.resolve();
    const second = coordinator.runMutation(1, () => Promise.resolve({
      ok: true,
      result: { step: "b" },
    }));

    releaseFirst();
    const [a, b] = await Promise.all([first, second]);
    expect(a).toMatchObject({ ok: true, revision: 2 });
    expect(b).toMatchObject({
      ok: false,
      code: "stale_state",
      currentRevision: 2,
    });
    expect(coordinator.peek()).toBe(2);
  });

  it("runMutationFromPayload rejects missing expectedRevision", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const result = await coordinator.runMutationFromPayload({}, () => Promise.resolve({
      ok: true,
      result: {},
    }));
    expect(result).toEqual({
      ok: false,
      code: "invalid_payload",
      retryable: false,
    });
    expect(coordinator.peek()).toBe(1);
  });

  it("serializes event revision advance through the coordinator", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const revision = await coordinator.runEventPublication(
      (_current, advance) => advance(),
    );
    expect(revision).toBe(2);
    expect(coordinator.peek()).toBe(2);
  });

  it("runSerializedMutation advances without expectedRevision (window:show)", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const result = await coordinator.runSerializedMutation(() => Promise.resolve({
      ok: true,
      result: { visible: true },
    }));
    expect(result).toEqual({
      ok: true,
      result: { visible: true },
      revision: 2,
    });
    expect(coordinator.peek()).toBe(2);
  });

  it("does not retain the aggregate lock while a reservation awaits consent", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const reservation = await coordinator.reserveMutation(1);
    expect("id" in reservation).toBe(true);
    if (!("id" in reservation)) {
      return;
    }

    await expect(
      coordinator.observe((revision) => ({ revision })),
    ).resolves.toEqual({ revision: 1 });
    await coordinator.cancelReservation(reservation);
  });

  it("rejects a reservation commit when its revision changed while pending", async () => {
    const coordinator = new SdkSessionRevisionCoordinator();
    const reservation = await coordinator.reserveMutation(1);
    expect("id" in reservation).toBe(true);
    if (!("id" in reservation)) {
      return;
    }
    await coordinator.runSerializedMutation(() =>
      Promise.resolve({ ok: true, result: { changed: true } }),
    );

    const result = await coordinator.commitReservation(reservation, () =>
      Promise.resolve({ ok: true, result: { activated: true } }),
    );
    expect(result).toMatchObject({
      ok: false,
      code: "stale_state",
      currentRevision: 2,
    });
  });
});

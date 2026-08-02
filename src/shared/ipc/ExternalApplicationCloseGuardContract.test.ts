import { describe, expect, it } from "vitest";
import {
  evaluateExternalApplicationCloseGuard,
  parseExternalApplicationCloseGuardQueryPayload,
  parseExternalApplicationCloseGuardResultPayload,
  resolveExternalApplicationCloseAction,
} from "./ExternalApplicationCloseGuardContract.js";

describe("ExternalApplicationCloseGuardContract", () => {
  it("parses query and result envelopes", () => {
    expect(
      parseExternalApplicationCloseGuardQueryPayload({ requestId: "req-1" }),
    ).toEqual({ requestId: "req-1" });
    expect(
      parseExternalApplicationCloseGuardResultPayload({
        requestId: "req-1",
        allow: false,
      }),
    ).toEqual({ requestId: "req-1", allow: false });
    expect(parseExternalApplicationCloseGuardQueryPayload({})).toBeNull();
    expect(
      parseExternalApplicationCloseGuardResultPayload({
        requestId: "req-1",
        allow: "yes",
      }),
    ).toBeNull();
  });

  it("allows close when no guard is registered", async () => {
    await expect(evaluateExternalApplicationCloseGuard(null)).resolves.toBe(true);
  });

  it("requires explicit true from the guard", async () => {
    await expect(evaluateExternalApplicationCloseGuard(() => true)).resolves.toBe(
      true,
    );
    await expect(
      evaluateExternalApplicationCloseGuard(async () => false),
    ).resolves.toBe(false);
    await expect(
      evaluateExternalApplicationCloseGuard(() => 1 as unknown as boolean),
    ).resolves.toBe(false);
    await expect(
      evaluateExternalApplicationCloseGuard(() => {
        throw new Error("boom");
      }),
    ).resolves.toBe(false);
  });

  it("resolves interceptor actions without downgrading force/approved closes", () => {
    expect(
      resolveExternalApplicationCloseAction({
        forceClose: true,
        closeApproved: false,
        closeInFlight: false,
      }),
    ).toBe("allow_native_close");
    expect(
      resolveExternalApplicationCloseAction({
        forceClose: false,
        closeApproved: true,
        closeInFlight: false,
      }),
    ).toBe("allow_native_close");
    expect(
      resolveExternalApplicationCloseAction({
        forceClose: false,
        closeApproved: false,
        closeInFlight: true,
      }),
    ).toBe("ignore_duplicate");
    expect(
      resolveExternalApplicationCloseAction({
        forceClose: false,
        closeApproved: false,
        closeInFlight: false,
      }),
    ).toBe("run_guard");
  });
});

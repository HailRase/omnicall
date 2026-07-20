/**
 * DI-08: opaque profileRef codec + Facade port mapping (no secrets on command).
 */

import { describe, expect, it, vi } from "vitest";

import { createSavedAccountProfile } from "@domain/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import {
  decodeSdkProfileRef,
  encodeSdkProfileRef,
} from "@shared/integration/sdkProfileRefCodec.js";
import { ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE } from "@application/facades/accountSignInCommand.js";

import { createSdkAccountPortFromFacade } from "./createSdkAccountPortFromFacade.js";

describe("sdkProfileRefCodec", () => {
  it("round-trips profile ids that contain @ and |", () => {
    const id = "1001@pbx.example|alt.host";
    const ref = encodeSdkProfileRef(id);
    expect(ref).toMatch(/^prf_[A-Za-z0-9_-]+$/);
    expect(decodeSdkProfileRef(ref!)).toBe(id);
  });

  it("rejects malformed refs", () => {
    expect(decodeSdkProfileRef("not-a-ref")).toBeNull();
    expect(decodeSdkProfileRef("prf_")).toBeNull();
    expect(encodeSdkProfileRef("")).toBeNull();
  });
});

describe("createSdkAccountPortFromFacade", () => {
  it("activates SIP-only saved profile without password on the command", async () => {
    const profile = createSavedAccountProfile(
      {
        username: "1001",
        domain: "pbx.example",
        server: "wss://sip.example",
      },
      { lifecycleStatus: "successful", successfulUseAt: "2026-07-20T10:00:00.000Z" },
    );
    expect(profile.ok).toBe(true);
    if (!profile.ok) {
      return;
    }
    const signInAccount = vi.fn(() =>
      Promise.resolve(ok({ kind: "sip_ready" as const })),
    );
    const port = createSdkAccountPortFromFacade({
      facade: {
        listSavedAccountProfiles: () => Promise.resolve(ok([profile.value])),
        signInAccount,
      } as never,
      ocpModuleEnabled: false,
    });
    const ref = encodeSdkProfileRef(profile.value.id)!;
    const result = await port.activateSavedProfile(ref);
    expect(result.ok).toBe(true);
    expect(signInAccount).toHaveBeenCalledWith({
      mode: "sip_only",
      profile: { kind: "saved", profileId: profile.value.id },
    });
    expect(JSON.stringify(signInAccount.mock.calls)).not.toMatch(
      /password|apiKey|secret/i,
    );
  });

  it("rejects draft profiles as forbidden", async () => {
    const profile = createSavedAccountProfile({
      username: "1001",
      domain: "pbx.example",
      server: "wss://sip.example",
    });
    expect(profile.ok).toBe(true);
    if (!profile.ok) {
      return;
    }
    const signInAccount = vi.fn();
    const port = createSdkAccountPortFromFacade({
      facade: {
        listSavedAccountProfiles: () => Promise.resolve(ok([profile.value])),
        signInAccount,
      } as never,
    });
    const result = await port.activateSavedProfile(
      encodeSdkProfileRef(profile.value.id)!,
    );
    expect(result).toEqual(
      err(createPlatformError("forbidden", "sdk_activate_profile_not_approved")),
    );
    expect(signInAccount).not.toHaveBeenCalled();
  });

  it("propagates logout-first lock from Facade", async () => {
    const profile = createSavedAccountProfile(
      {
        username: "1001",
        domain: "pbx.example",
        server: "wss://sip.example",
      },
      { lifecycleStatus: "successful", successfulUseAt: "2026-07-20T10:00:00.000Z" },
    );
    expect(profile.ok).toBe(true);
    if (!profile.ok) {
      return;
    }
    const port = createSdkAccountPortFromFacade({
      facade: {
        listSavedAccountProfiles: () => Promise.resolve(ok([profile.value])),
        signInAccount: () =>
          Promise.resolve(
            err(
              createPlatformError(
                "operation_failed",
                ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE,
              ),
            ),
          ),
      } as never,
    });
    const result = await port.activateSavedProfile(
      encodeSdkProfileRef(profile.value.id)!,
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toBe(ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE);
  });

  it("rejects OCP saved profile when OCP module is disabled", async () => {
    const created = createSavedAccountProfile(
      {
        username: "agent1",
        domain: "ocp.example",
        server: "sip:ocp.example",
      },
      {
        lifecycleStatus: "successful",
        successfulUseAt: "2026-07-20T10:00:00.000Z",
        ocpDomain: "ocp.example",
      },
    );
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const signInAccount = vi.fn();
    const port = createSdkAccountPortFromFacade({
      facade: {
        listSavedAccountProfiles: () => Promise.resolve(ok([created.value])),
        signInAccount,
      } as never,
      ocpModuleEnabled: false,
    });
    const result = await port.activateSavedProfile(
      encodeSdkProfileRef(created.value.id)!,
    );
    expect(result).toEqual(
      err(createPlatformError("forbidden", "sdk_activate_profile_not_approved")),
    );
    expect(signInAccount).not.toHaveBeenCalled();
  });

  it("activates OCP saved profile with login/domain only when OCP enabled", async () => {
    const created = createSavedAccountProfile(
      {
        username: "agent1",
        domain: "ocp.example",
        server: "sip:ocp.example",
      },
      {
        lifecycleStatus: "successful",
        successfulUseAt: "2026-07-20T10:00:00.000Z",
        ocpDomain: "ocp.example",
      },
    );
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const signInAccount = vi.fn(() =>
      Promise.resolve(ok({ kind: "sip_ready" as const })),
    );
    const port = createSdkAccountPortFromFacade({
      facade: {
        listSavedAccountProfiles: () => Promise.resolve(ok([created.value])),
        signInAccount,
      } as never,
      ocpModuleEnabled: true,
    });
    const result = await port.activateSavedProfile(
      encodeSdkProfileRef(created.value.id)!,
    );
    expect(result.ok).toBe(true);
    expect(signInAccount).toHaveBeenCalledWith({
      mode: "ocp",
      profile: { kind: "saved", profileId: created.value.id },
      ocp: { login: "agent1", domain: "ocp.example" },
    });
    expect(JSON.stringify(signInAccount.mock.calls)).not.toMatch(/apiKey|password/i);
  });
});

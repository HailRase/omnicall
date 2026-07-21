import { describe, expect, it } from "vitest";
import {
  parseSdkGatewaySettingsOperation,
  parseSdkGatewaySettingsResponse,
} from "./SdkGatewaySettingsContract.js";

const listeningDiagnostics = {
  status: "listening" as const,
  bindHost: "127.0.0.1",
  bindPort: 17341,
  connectionCount: 1,
  authenticatedCount: 1,
  unauthenticatedCount: 0,
  pendingPairingCount: 0,
  pairedClientCount: 1,
  allowedOriginsCount: 1,
  lastErrorCode: null,
  windowHideAvailable: false as const,
};

const validPairedClient = {
  clientId: "cli_1",
  origin: "https://crm.example",
  profile: "presentation",
  applicationName: "CRM",
  createdAt: "2026-07-20T00:00:00.000Z",
  expiresAt: null,
  revoked: false,
  capabilityCount: 2,
};

const validPending = {
  pairingRequestId: "pair_1",
  clientId: "cli_2",
  origin: "https://crm.example",
  applicationName: "CRM Tab",
  profile: "presentation",
  expiresAt: "2026-07-20T01:00:00.000Z",
};
const validOrigin = {
  origin: "https://crm.example",
  state: "allowed" as const,
  matrix: {
    capabilities: {
      "session.read.redacted": true,
      "window.show": true,
      "operator.status.write": true,
      "session.logout": true,
      "call.originate": true,
      "call.control": true,
      "account.activate": false,
    },
  },
  previouslyAllowed: true,
};

describe("SdkGatewaySettingsContract", () => {
  it("parses applyPolicy and rejects wildcard origins", () => {
    expect(
      parseSdkGatewaySettingsOperation({
        op: "applyPolicy",
        policy: {
          originsManaged: true,
          origins: [validOrigin],
        },
      }),
    ).toEqual({
      op: "applyPolicy",
      policy: {
        originsManaged: true,
        origins: [validOrigin],
      },
    });
    expect(
      parseSdkGatewaySettingsOperation({
        op: "applyPolicy",
        policy: {
          originsManaged: true,
          origins: [{ ...validOrigin, origin: "https://*.example" }],
        },
      }),
    ).toBeNull();
  });

  it("parses grant response without secret fields", () => {
    const parsed = parseSdkGatewaySettingsResponse({
      ok: true,
      grant: { ok: true, profileRef: "prf_abc" },
      snapshot: {
        diagnostics: listeningDiagnostics,
        origins: [validOrigin],
        pendingOriginTrust: [],
        paired: [validPairedClient],
        pendingPairing: [],
      },
    });
    expect(parsed?.ok).toBe(true);
    if (parsed && parsed.ok && "grant" in parsed) {
      expect(parsed.grant).toEqual({ ok: true, profileRef: "prf_abc" });
      expect(parsed.snapshot.paired).toEqual([validPairedClient]);
      expect(JSON.stringify(parsed)).not.toMatch(/password|apiKey|token|privateKey/i);
    }
  });

  it("deep-validates paired/pending and rejects secret keys or wildcards", () => {
    const ok = parseSdkGatewaySettingsResponse({
      ok: true,
      snapshot: {
        diagnostics: listeningDiagnostics,
        origins: [validOrigin],
        pendingOriginTrust: [],
        paired: [validPairedClient],
        pendingPairing: [validPending],
      },
    });
    expect(ok?.ok).toBe(true);
    if (ok && ok.ok) {
      expect(ok.snapshot.pendingPairing).toEqual([validPending]);
    }

    expect(
      parseSdkGatewaySettingsResponse({
        ok: true,
        snapshot: {
          diagnostics: listeningDiagnostics,
        origins: [{ ...validOrigin, origin: "https://*.evil" }],
        pendingOriginTrust: [],
          paired: [],
          pendingPairing: [],
        },
      }),
    ).toBeNull();

    expect(
      parseSdkGatewaySettingsResponse({
        ok: true,
        snapshot: {
          diagnostics: listeningDiagnostics,
          origins: [validOrigin],
          pendingOriginTrust: [],
          paired: [
            {
              ...validPairedClient,
              privateKey: "pk_leak",
            },
          ],
          pendingPairing: [],
        },
      }),
    ).toBeNull();

    expect(
      parseSdkGatewaySettingsResponse({
        ok: true,
        grant: { ok: true, profileRef: "prf_ok", apiKey: "secret" },
        snapshot: {
          diagnostics: listeningDiagnostics,
          origins: [validOrigin],
          pendingOriginTrust: [],
          paired: [],
          pendingPairing: [],
        },
      }),
    ).toBeNull();

    expect(
      parseSdkGatewaySettingsResponse({
        ok: true,
        snapshot: {
          diagnostics: listeningDiagnostics,
          origins: [validOrigin],
          pendingOriginTrust: [],
          paired: [{ ...validPairedClient, capabilityCount: -1 }],
          pendingPairing: [],
        },
      }),
    ).toBeNull();
  });
});

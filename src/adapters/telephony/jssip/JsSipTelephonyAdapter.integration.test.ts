import { describe, expect, it } from "vitest";
import {
  createSipAccount,
  createSipAccountId,
} from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { JsSipTelephonyAdapter } from "./JsSipTelephonyAdapter.js";

const sandboxEnabled = process.env["SIP_SANDBOX"] === "1";

describe.skipIf(!sandboxEnabled)("JsSipTelephonyAdapter integration", () => {
  const registrar = process.env["VITE_SIP_REGISTRAR"] ?? "";
  const username = process.env["VITE_SIP_USERNAME"] ?? "";
  const password = process.env["VITE_SIP_PASSWORD"] ?? "";
  const uri = process.env["VITE_SIP_URI"] ?? "";

  it("registers against configured SIP sandbox", async () => {
    if (registrar.length === 0 || username.length === 0 || password.length === 0) {
      throw new Error("SIP_SANDBOX requires VITE_SIP_REGISTRAR, VITE_SIP_USERNAME, VITE_SIP_PASSWORD");
    }

    const account = createSipAccount(createSipAccountId(username), {
      uri: uri.length > 0 ? uri : `sip:${username}@sandbox`,
      username,
      password,
      registrar,
    });

    const adapter = new JsSipTelephonyAdapter({
      logger: createTestLogger({ featureId: "F-001", boundedContext: "Telephony" }),
    });

    const result = await adapter.register({
      account,
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    await adapter.unregister(createCorrelationId());
  }, 30_000);
});

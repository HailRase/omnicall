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
  const server = process.env["VITE_SIP_SERVER"] ?? "";
  const domain = process.env["VITE_SIP_DOMAIN"] ?? "";
  const username = process.env["VITE_SIP_USERNAME"] ?? "";
  const password = process.env["VITE_SIP_PASSWORD"] ?? "";

  it("registers against configured SIP sandbox", async () => {
    if (
      server.length === 0 ||
      domain.length === 0 ||
      username.length === 0 ||
      password.length === 0
    ) {
      throw new Error(
        "SIP_SANDBOX requires VITE_SIP_SERVER, VITE_SIP_DOMAIN, VITE_SIP_USERNAME, VITE_SIP_PASSWORD",
      );
    }

    const account = createSipAccount(createSipAccountId(username), {
      username,
      password,
      domain,
      server,
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

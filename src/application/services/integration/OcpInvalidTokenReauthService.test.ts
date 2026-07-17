import { describe, expect, it, vi } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { ok, err } from "@shared/result/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { OcpProjectionHub } from "../../read-models/OcpProjectionHub.js";
import { OcpInvalidTokenReauthService } from "./OcpInvalidTokenReauthService.js";

describe("OcpInvalidTokenReauthService", () => {
  it("triggers one HTTP reauth on INVALID_TOKEN feedback", async () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const reauthenticate = vi.fn(() => Promise.resolve(ok(undefined)));
    const service = new OcpInvalidTokenReauthService({
      projectionHub: hub,
      reauthenticate,
      logger: createTestLogger(),
    });

    hub.setAuthFeedback("INVALID_TOKEN");
    await vi.waitFor(() => {
      expect(reauthenticate).toHaveBeenCalledTimes(1);
    });

    hub.setAuthFeedback("INVALID_TOKEN");
    await Promise.resolve();
    expect(reauthenticate).toHaveBeenCalledTimes(1);

    service.dispose();
    hub.dispose();
  });

  it("does not reauth for other feedback reasons", async () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const reauthenticate = vi.fn(() =>
      Promise.resolve(err(createPlatformError("operation_failed", "nope"))),
    );
    const service = new OcpInvalidTokenReauthService({
      projectionHub: hub,
      reauthenticate,
      logger: createTestLogger(),
    });

    hub.setAuthFeedback("SESSION_EXIST");
    await Promise.resolve();
    expect(reauthenticate).not.toHaveBeenCalled();

    service.dispose();
    hub.dispose();
  });

  it("resets the automatic retry budget after a new authorized session", async () => {
    const gateway = new MockOcpGateway();
    const hub = new OcpProjectionHub({ ocpGateway: gateway });
    const reauthenticate = vi.fn(() => Promise.resolve(ok(undefined)));
    const service = new OcpInvalidTokenReauthService({
      projectionHub: hub,
      reauthenticate,
      logger: createTestLogger(),
    });

    hub.setAuthFeedback("INVALID_TOKEN");
    await vi.waitFor(() => {
      expect(reauthenticate).toHaveBeenCalledTimes(1);
    });

    const attemptId = createCorrelationId();
    hub.beginAttempt(attemptId);
    hub.markAuthorizationPending(attemptId);
    gateway.simulateAuthSuccess(7);
    hub.setAuthFeedback("INVALID_TOKEN");

    await vi.waitFor(() => {
      expect(reauthenticate).toHaveBeenCalledTimes(2);
    });
    service.dispose();
    hub.dispose();
  });
});

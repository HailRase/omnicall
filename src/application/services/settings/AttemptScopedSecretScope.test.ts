import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { AttemptScopedSecretScope } from "./AttemptScopedSecretScope.js";

describe("AttemptScopedSecretScope", () => {
  it("keeps boundary secrets only until TTL expires", () => {
    let now = 1_000;
    const scope = new AttemptScopedSecretScope(100, () => now);
    const attemptId = createCorrelationId();
    scope.store(attemptId, {
      sipPassword: "sip-secret",
      ocpApiKey: "ocp-secret",
    });

    expect(scope.read(attemptId)).toEqual({
      sipPassword: "sip-secret",
      ocpApiKey: "ocp-secret",
    });
    now = 1_101;
    expect(scope.read(attemptId)).toBeNull();
  });
});

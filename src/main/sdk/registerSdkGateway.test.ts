import { afterEach, describe, expect, it } from "vitest";

import {
  isSdkGatewayPrimaryInstance,
  resetSdkGatewayRegistrationForTests,
  setSdkGatewayPrimaryInstance,
  startSdkGateway,
} from "./registerSdkGateway.js";

afterEach(async () => {
  await resetSdkGatewayRegistrationForTests();
});

describe("registerSdkGateway", () => {
  it("tracks primary instance ownership for endpoint claim", () => {
    expect(isSdkGatewayPrimaryInstance()).toBe(true);
    setSdkGatewayPrimaryInstance(false);
    expect(isSdkGatewayPrimaryInstance()).toBe(false);
    setSdkGatewayPrimaryInstance(true);
    expect(isSdkGatewayPrimaryInstance()).toBe(true);
  });

  it("starts disabled when OMNICALL_SDK_GATEWAY=0", async () => {
    const previous = process.env["OMNICALL_SDK_GATEWAY"];
    process.env["OMNICALL_SDK_GATEWAY"] = "0";
    try {
      const gateway = await startSdkGateway({
        desktopVersion: "0.11.2-test",
        skipOriginTrustHydrate: true,
      });
      expect(gateway).not.toBeNull();
      expect(gateway?.getStatus()).toBe("disabled");
    } finally {
      if (previous === undefined) {
        delete process.env["OMNICALL_SDK_GATEWAY"];
      } else {
        process.env["OMNICALL_SDK_GATEWAY"] = previous;
      }
    }
  });
});

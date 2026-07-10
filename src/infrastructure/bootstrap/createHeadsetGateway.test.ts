import { describe, expect, it } from "vitest";
import { WebHidHeadsetAdapter } from "@adapters/headset/webhid/WebHidHeadsetAdapter.js";
import { SdkHeadsetGatewayStub } from "@adapters/headset/sdk/SdkHeadsetGatewayStub.js";
import { MockHeadsetGateway } from "@adapters/mock/MockHeadsetGateway.js";
import { createHeadsetGateway } from "./createHeadsetGateway.js";

describe("createHeadsetGateway", () => {
  it("defaults to WebHidHeadsetAdapter", () => {
    expect(createHeadsetGateway()).toBeInstanceOf(WebHidHeadsetAdapter);
  });

  it("returns WebHidHeadsetAdapter for webhid", () => {
    expect(createHeadsetGateway("webhid")).toBeInstanceOf(WebHidHeadsetAdapter);
  });

  it("returns MockHeadsetGateway for mock", () => {
    expect(createHeadsetGateway("mock")).toBeInstanceOf(MockHeadsetGateway);
  });

  it("returns SdkHeadsetGatewayStub for sdk-stub", () => {
    const gateway = createHeadsetGateway("sdk-stub");
    expect(gateway).toBeInstanceOf(SdkHeadsetGatewayStub);
    expect(gateway.isSupported()).toBe(false);
  });
});

describe("SdkHeadsetGatewayStub", () => {
  it("rejects connect and send as not_implemented", async () => {
    const gateway = new SdkHeadsetGatewayStub();
    const connectResult = await gateway.connect();
    expect(connectResult.ok).toBe(false);
    if (!connectResult.ok) {
      expect(connectResult.error.code).toBe("not_implemented");
    }

    const sendResult = await gateway.send({ type: "answer" });
    expect(sendResult.ok).toBe(false);
    if (!sendResult.ok) {
      expect(sendResult.error.code).toBe("not_implemented");
    }
  });
});

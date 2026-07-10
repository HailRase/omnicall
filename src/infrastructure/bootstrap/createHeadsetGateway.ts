import { WebHidHeadsetAdapter } from "@adapters/headset/webhid/WebHidHeadsetAdapter.js";
import { SdkHeadsetGatewayStub } from "@adapters/headset/sdk/SdkHeadsetGatewayStub.js";
import { MockHeadsetGateway } from "@adapters/mock/MockHeadsetGateway.js";
import type { HeadsetGateway } from "@ports/headset/HeadsetGateway.js";

/**
 * - Purpose: DI factory for HeadsetGateway transport selection.
 * - Inputs: transport id (webhid | mock | sdk-stub).
 * - Outputs: HeadsetGateway implementation; default webhid for real bootstrap.
 */

export type HeadsetGatewayTransport = "webhid" | "mock" | "sdk-stub";

export function createHeadsetGateway(
  transport: HeadsetGatewayTransport = "webhid",
): HeadsetGateway {
  switch (transport) {
    case "webhid":
      return new WebHidHeadsetAdapter();
    case "mock":
      return new MockHeadsetGateway();
    case "sdk-stub":
      return new SdkHeadsetGatewayStub();
    default: {
      const _exhaustive: never = transport;
      return _exhaustive;
    }
  }
}

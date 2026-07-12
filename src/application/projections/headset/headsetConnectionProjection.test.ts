import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createHeadsetConnected,
  createHeadsetDeviceId,
  createHeadsetDisconnected,
  createHeadsetFaultOccurred,
} from "@domain/index.js";
import {
  initialHeadsetConnectionProjection,
  reduceHeadsetConnectionProjection,
} from "./headsetConnectionProjection.js";

describe("headsetConnectionProjection faults", () => {
  it("stores fault reason and clears it on reconnect", () => {
    const faulted = reduceHeadsetConnectionProjection(
      initialHeadsetConnectionProjection(),
      createHeadsetFaultOccurred(createCorrelationId(), "connect_failed"),
    );

    expect(faulted.lastFaultReason).toBe("connect_failed");
    expect(faulted.connectionState).toBe("error");

    const reconnected = reduceHeadsetConnectionProjection(
      faulted,
      createHeadsetConnected(
        createCorrelationId(),
        createHeadsetDeviceId("1:2:test"),
        "Test Headset",
      ),
    );

    expect(reconnected.lastFaultReason).toBeNull();
    expect(reconnected.connectionState).toBe("connected");
    expect(reconnected.deviceId).toBe("1:2:test");
    expect(reconnected.deviceLabel).toBe("Test Headset");
  });

  it("stores capabilities from HeadsetConnected and clears on disconnect", () => {
    const connected = reduceHeadsetConnectionProjection(
      initialHeadsetConnectionProjection(),
      createHeadsetConnected(
        createCorrelationId(),
        createHeadsetDeviceId("1:2:test"),
        "Test Headset",
        {
          supportsAnswer: true,
          supportsReject: true,
          supportsHangup: true,
          supportsHold: false,
          supportsMute: true,
          supportsRejectOnHookOn: true,
          muteInputMode: "pulse",
        },
      ),
    );

    expect(connected.capabilities).toEqual({
      supportsAnswer: true,
      supportsReject: true,
      supportsHangup: true,
      supportsHold: false,
      supportsMute: true,
      supportsRejectOnHookOn: true,
      muteInputMode: "pulse",
    });

    const disconnected = reduceHeadsetConnectionProjection(
      connected,
      createHeadsetDisconnected(createCorrelationId(), createHeadsetDeviceId("1:2:test")),
    );

    expect(disconnected.capabilities).toBeNull();
  });

  it("marks usb disconnect as disconnected with warning fault", () => {
    const connected = reduceHeadsetConnectionProjection(
      initialHeadsetConnectionProjection(),
      createHeadsetConnected(
        createCorrelationId(),
        createHeadsetDeviceId("1:2:test"),
        "Test Headset",
      ),
    );
    const next = reduceHeadsetConnectionProjection(
      connected,
      createHeadsetFaultOccurred(createCorrelationId(), "usb_disconnected"),
    );

    expect(next.connectionState).toBe("disconnected");
    expect(next.deviceLabel).toBeNull();
    expect(next.lastFaultReason).toBe("usb_disconnected");
  });
});

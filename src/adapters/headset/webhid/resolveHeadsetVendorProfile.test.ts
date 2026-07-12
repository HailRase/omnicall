import { describe, expect, it } from "vitest";
import { createMockHidDevice } from "./createMockHidDevice.js";
import {
  HID_VENDOR_JABRA,
  HID_VENDOR_PLANTRONICS,
  JABRA_HSC016_PRODUCT_IDS,
  PLANTRONICS_BW3320_PRODUCT_IDS,
} from "./hidConstants.js";
import { resolveHeadsetVendorProfile } from "./resolveHeadsetVendorProfile.js";

describe("resolveHeadsetVendorProfile match order", () => {
  it("matches Jabra HSC016 product IDs before generic Jabra", () => {
    const productId = [...JABRA_HSC016_PRODUCT_IDS][0]!;
    const profile = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: HID_VENDOR_JABRA, productId }),
    );
    expect(profile.id).toBe("jabra-hsc016");
  });

  it("matches Poly BW3320 product IDs before generic Poly", () => {
    const productId = [...PLANTRONICS_BW3320_PRODUCT_IDS][0]!;
    const profile = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: HID_VENDOR_PLANTRONICS, productId }),
    );
    expect(profile.id).toBe("poly-bw3320");
  });

  it("matches generic Jabra by vendorId", () => {
    const profile = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: HID_VENDOR_JABRA, productId: 0x9999 }),
    );
    expect(profile.id).toBe("jabra-evolve");
  });

  it("matches generic Poly by vendorId", () => {
    const profile = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: HID_VENDOR_PLANTRONICS, productId: 0x9999 }),
    );
    expect(profile.id).toBe("poly-generic");
  });

  it("falls back to generic telephony", () => {
    const profile = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: 0x1234, productId: 0x5678 }),
    );
    expect(profile.id).toBe("generic-telephony");
  });

  it("Poly profiles use swallowAll mute echo policy for firmware LED bounce", () => {
    const bw3320Id = [...PLANTRONICS_BW3320_PRODUCT_IDS][0]!;
    const bw3320 = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: HID_VENDOR_PLANTRONICS, productId: bw3320Id }),
    );
    const genericPoly = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: HID_VENDOR_PLANTRONICS, productId: 0x9999 }),
    );

    expect(bw3320.capabilities.muteEchoPolicy).toBe("swallowAll");
    expect(genericPoly.capabilities.muteEchoPolicy).toBe("swallowAll");
  });
});

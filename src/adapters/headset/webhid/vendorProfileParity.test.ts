import { describe, expect, it } from "vitest";
import { createMockHidDevice } from "./createMockHidDevice.js";
import {
  HID_VENDOR_JABRA,
  HID_VENDOR_PLANTRONICS,
  JABRA_HSC016_HOOK_REPORT_ID,
  JABRA_HSC016_LEGACY_MUTE_REPORT_ID,
  JABRA_HSC016_PRODUCT_IDS,
  PLANTRONICS_BW3320_PRODUCT_IDS,
  PLANTRONICS_BW3320_TELEPHONY_REPORT_ID,
} from "./hidConstants.js";
import { createStandardLedProfile, jabraEvolveLedProfile } from "./ledProfiles.js";
import { resolveHeadsetVendorProfile } from "./resolveHeadsetVendorProfile.js";

function dataViewFromBytes(bytes: ReadonlyArray<number>): DataView {
  return new DataView(Uint8Array.from(bytes).buffer);
}

describe("vendor profile parser snapshots", () => {
  it("parses Jabra HSC016 hook and mute bytes", () => {
    const productId = [...JABRA_HSC016_PRODUCT_IDS][0]!;
    const { parser } = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: HID_VENDOR_JABRA, productId }),
    );

    expect(parser.parseUpdate(JABRA_HSC016_HOOK_REPORT_ID, dataViewFromBytes([0x01]))).toEqual({
      hookSwitch: true,
      phoneMute: false,
    });
    expect(parser.parseUpdate(JABRA_HSC016_HOOK_REPORT_ID, dataViewFromBytes([0x02]))).toEqual({
      hookSwitch: false,
      phoneMute: false,
    });
    expect(parser.parseUpdate(JABRA_HSC016_HOOK_REPORT_ID, dataViewFromBytes([0x07]))).toEqual({
      phoneMute: true,
    });
    expect(parser.parseUpdate(JABRA_HSC016_HOOK_REPORT_ID, dataViewFromBytes([0x03]))).toEqual({
      phoneMute: false,
    });
    expect(
      parser.parseUpdate(JABRA_HSC016_LEGACY_MUTE_REPORT_ID, dataViewFromBytes([0x08])),
    ).toEqual({ phoneMute: true });
  });

  it("parses Poly BW3320 telephony report bytes", () => {
    const productId = [...PLANTRONICS_BW3320_PRODUCT_IDS][0]!;
    const { parser } = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: HID_VENDOR_PLANTRONICS, productId }),
    );

    expect(
      parser.parseUpdate(PLANTRONICS_BW3320_TELEPHONY_REPORT_ID, dataViewFromBytes([0x01])),
    ).toEqual({ hookSwitch: true, phoneMute: false });
    expect(
      parser.parseUpdate(PLANTRONICS_BW3320_TELEPHONY_REPORT_ID, dataViewFromBytes([0x04])),
    ).toEqual({ hookSwitch: false, phoneMute: true });
    expect(
      parser.parseUpdate(PLANTRONICS_BW3320_TELEPHONY_REPORT_ID, dataViewFromBytes([0x05])),
    ).toEqual({ hookSwitch: true, phoneMute: true });
  });

  it("parses generic Jabra report 2 bytes", () => {
    const { parser } = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: HID_VENDOR_JABRA, productId: 0xabcd }),
    );

    expect(parser.parseUpdate(2, dataViewFromBytes([0x01]))).toEqual({
      hookSwitch: true,
      phoneMute: false,
    });
    expect(parser.parseUpdate(2, dataViewFromBytes([0x05]))).toEqual({
      hookSwitch: true,
      phoneMute: true,
    });
    expect(parser.parseUpdate(2, dataViewFromBytes([0x07]))).toEqual({
      phoneMute: true,
    });
  });
});

describe("vendor profile LED encode snapshots", () => {
  it("encodes Jabra Evolve / HSC016 LED bits", () => {
    expect(
      Array.from(jabraEvolveLedProfile.encode({ mute: false, offHook: true, ringing: false })),
    ).toEqual([0x01, 0x00]);
    expect(
      Array.from(jabraEvolveLedProfile.encode({ mute: true, offHook: true, ringing: false })),
    ).toEqual([0x13, 0x00]);
    expect(
      Array.from(jabraEvolveLedProfile.encode({ mute: false, offHook: false, ringing: true })),
    ).toEqual([0x24, 0x00]);
    expect(
      Array.from(jabraEvolveLedProfile.encode({ mute: true, offHook: true, ringing: true })),
    ).toEqual([0x37, 0x00]);
  });

  it("uses Evolve LED for HSC016 and name-matched Evolve", () => {
    const hsc016Id = [...JABRA_HSC016_PRODUCT_IDS][0]!;
    const hsc016Device = createMockHidDevice({
      vendorId: HID_VENDOR_JABRA,
      productId: hsc016Id,
    });
    const evolveNamedDevice = createMockHidDevice({
      vendorId: HID_VENDOR_JABRA,
      productId: 0x1111,
      productName: "Jabra Evolve 65",
    });
    const genericJabraDevice = createMockHidDevice({
      vendorId: HID_VENDOR_JABRA,
      productId: 0x2222,
      productName: "Jabra Other",
    });

    const hsc016 = resolveHeadsetVendorProfile(hsc016Device);
    const evolveNamed = resolveHeadsetVendorProfile(evolveNamedDevice);
    const genericJabra = resolveHeadsetVendorProfile(genericJabraDevice);

    expect(hsc016.ledProfile(hsc016Device).encode).toBe(jabraEvolveLedProfile.encode);
    expect(evolveNamed.ledProfile(evolveNamedDevice).encode).toBe(jabraEvolveLedProfile.encode);
    expect(genericJabra.ledProfile(genericJabraDevice).reportId).toBe(
      createStandardLedProfile(genericJabraDevice).reportId,
    );
    expect(
      Array.from(
        genericJabra
          .ledProfile(genericJabraDevice)
          .encode({ mute: true, offHook: true, ringing: true }),
      ),
    ).toEqual([0x07]);
  });

  it("encodes standard LED for Poly generic", () => {
    const device = createMockHidDevice({ vendorId: HID_VENDOR_PLANTRONICS, productId: 0x9999 });
    const profile = resolveHeadsetVendorProfile(device);
    expect(
      Array.from(profile.ledProfile(device).encode({ mute: true, offHook: true, ringing: false })),
    ).toEqual([0x03]);
  });
});

describe("vendor profile first-report quirks", () => {
  it("Jabra profiles emit hookOff when first report is already off-hook", () => {
    const hsc016Id = [...JABRA_HSC016_PRODUCT_IDS][0]!;
    const jabra = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: HID_VENDOR_JABRA, productId: hsc016Id }),
    );
    expect(jabra.quirks?.syntheticEventsOnFirstReport?.({ hookSwitch: true })).toEqual([
      { type: "hookOff" },
    ]);
    expect(jabra.quirks?.syntheticEventsOnFirstReport?.({ hookSwitch: false })).toEqual([]);
  });

  it("generic telephony has no synthetic first-report events", () => {
    const profile = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: 0x1234, productId: 0x5678 }),
    );
    expect(profile.quirks?.syntheticEventsOnFirstReport).toBeUndefined();
  });

  it("Poly profiles have no synthetic first-report events", () => {
    const productId = [...PLANTRONICS_BW3320_PRODUCT_IDS][0]!;
    const profile = resolveHeadsetVendorProfile(
      createMockHidDevice({ vendorId: HID_VENDOR_PLANTRONICS, productId }),
    );
    expect(profile.quirks?.syntheticEventsOnFirstReport).toBeUndefined();
  });
});

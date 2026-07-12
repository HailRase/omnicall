import type { HeadsetVendorProfile } from "../types/HeadsetVendorProfile.js";
import { genericTelephonyProfile } from "./profiles/genericTelephony.profile.js";
import { jabraEvolveProfile } from "./profiles/jabraEvolve.profile.js";
import { jabraHsc016Profile } from "./profiles/jabraHsc016.profile.js";
import { polyBw3320Profile } from "./profiles/polyBw3320.profile.js";
import { polyGenericProfile } from "./profiles/polyGeneric.profile.js";

/**
 * - Purpose: resolve Web HID vendor profile by device match order.
 * - Inputs: HIDDevice (vendorId, productId, productName).
 * - Outputs: HeadsetVendorProfile (parser, LED, capabilities, quirks).
 */

/** Specific product IDs before vendorId fallbacks; generic last. */
export const HEADSET_VENDOR_PROFILES: ReadonlyArray<HeadsetVendorProfile> = [
  jabraHsc016Profile,
  polyBw3320Profile,
  jabraEvolveProfile,
  polyGenericProfile,
  genericTelephonyProfile,
];

export function resolveHeadsetVendorProfile(device: HIDDevice): HeadsetVendorProfile {
  for (const profile of HEADSET_VENDOR_PROFILES) {
    if (profile.match(device)) {
      return profile;
    }
  }
  return genericTelephonyProfile;
}

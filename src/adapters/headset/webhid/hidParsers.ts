import type { HeadsetCapabilities } from "@domain/index.js";
import { capabilitiesFromParser } from "./capabilitiesFromParser.js";
import type { HidReportParser } from "./hidTypes.js";
import { resolveHeadsetVendorProfile } from "./resolveHeadsetVendorProfile.js";

/**
 * - Purpose: thin facade — parser resolution via vendor profile registry.
 * - Inputs: HIDDevice.
 * - Outputs: HidReportParser and HeadsetCapabilities (parity with pre-EXT-1).
 */

export function resolveHidReportParser(device: HIDDevice): HidReportParser {
  return resolveHeadsetVendorProfile(device).parser;
}

export function resolveHeadsetCapabilitiesFromParser(
  parser: HidReportParser,
): HeadsetCapabilities {
  return capabilitiesFromParser(parser);
}

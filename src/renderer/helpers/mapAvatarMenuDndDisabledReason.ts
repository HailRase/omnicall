import { translateCurrent } from "../i18n/index.js";

type MapAvatarMenuDndDisabledReasonInput = Readonly<{
  phoneStatusDisabled: boolean;
  isSipRegistered: boolean;
}>;

/**
 * - Purpose: derive avatar menu DND toggle disabled reason.
 * - Inputs: phone status shell lock and SIP registration flag.
 * - Outputs: Russian disabled reason or null when DND toggle is allowed.
 */
export function mapAvatarMenuDndDisabledReason(
  input: MapAvatarMenuDndDisabledReasonInput,
): string | null {
  const { phoneStatusDisabled, isSipRegistered } = input;

  if (phoneStatusDisabled) {
    return translateCurrent("header.userMenu.dndDisabled.phoneStatusUnavailable");
  }

  if (!isSipRegistered) {
    return translateCurrent("header.userMenu.dndDisabled.notRegistered");
  }

  return null;
}

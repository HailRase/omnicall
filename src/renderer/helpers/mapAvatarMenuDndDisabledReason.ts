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
    return "Статус телефона недоступен";
  }

  if (!isSipRegistered) {
    return "Не зарегистрирован";
  }

  return null;
}

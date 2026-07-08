import { translateCurrent } from "../i18n/index.js";

export function mapDialpadDisabledReason(disabledState: string | null): string | null {
  if (disabledState === null) {
    return null;
  }
  switch (disabledState) {
    case "disabledByNotRegistered":
      return translateCurrent("dialpad.disabled.notRegistered");
    case "invalidNumber":
      return translateCurrent("dialpad.disabled.invalidNumber");
    case "disabledBySecondSessionPolicy":
      return translateCurrent("dialpad.disabled.secondSessionDisabled");
    case "disabledByHoldAllInProgress":
      return translateCurrent("dialpad.disabled.holdAllInProgress");
    case "disabledByConnectingInProgress":
      return translateCurrent("dialpad.disabled.connectingInProgress");
    case "calling":
      return translateCurrent("dialpad.disabled.calling");
    default:
      return translateCurrent("common.actionUnavailable");
  }
}

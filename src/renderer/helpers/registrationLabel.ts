import { translateCurrent } from "../i18n/index.js";

export function registrationLabel(
  registrationState: string,
  authUiState: string,
): string {
  if (authUiState === "sip_registering") {
    return translateCurrent("registration.state.registering");
  }

  switch (registrationState) {
    case "registered":
      return translateCurrent("registration.state.registered");
    case "failed":
      return translateCurrent("registration.state.failed");
    case "registering":
      return translateCurrent("registration.state.registering");
    default:
      return translateCurrent("registration.state.notRegistered");
  }
}

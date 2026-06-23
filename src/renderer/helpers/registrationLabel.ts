export function registrationLabel(
  registrationState: string,
  authUiState: string,
): string {
  if (authUiState === "sip_registering") {
    return "Registering";
  }

  switch (registrationState) {
    case "registered":
      return "Registered";
    case "failed":
      return "Failed";
    case "registering":
      return "Registering";
    default:
      return "Not registered";
  }
}

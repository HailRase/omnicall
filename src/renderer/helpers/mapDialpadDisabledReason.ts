export function mapDialpadDisabledReason(disabledState: string | null): string | null {
  if (disabledState === null) {
    return null;
  }
  switch (disabledState) {
    case "disabledByNotRegistered":
      return "Not registered";
    case "invalidNumber":
      return "Invalid number";
    case "disabledByOcpReserved":
      return "OCP reserved";
    case "disabledBySecondSessionPolicy":
      return "Second session disabled";
    case "calling":
      return "Call already connecting";
    default:
      return "Action unavailable";
  }
}

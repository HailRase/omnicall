export function registrationLabel(
  registrationState: string,
  authUiState: string,
): string {
  if (authUiState === "sip_registering") {
    return "Регистрация";
  }

  switch (registrationState) {
    case "registered":
      return "Зарегистрирован";
    case "failed":
      return "Ошибка";
    case "registering":
      return "Регистрация";
    default:
      return "Не зарегистрирован";
  }
}

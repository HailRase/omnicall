export function mapDialpadDisabledReason(disabledState: string | null): string | null {
  if (disabledState === null) {
    return null;
  }
  switch (disabledState) {
    case "disabledByNotRegistered":
      return "Не зарегистрирован";
    case "invalidNumber":
      return "Некорректный номер";
    case "disabledByOcpReserved":
      return "Зарезервировано OCP";
    case "disabledBySecondSessionPolicy":
      return "Вторая сессия отключена";
    case "disabledByHoldAllInProgress":
      return "Удержание других звонков…";
    case "disabledByConnectingInProgress":
      return "Соединение…";
    case "calling":
      return "Звонок уже соединяется";
    default:
      return "Действие недоступно";
  }
}

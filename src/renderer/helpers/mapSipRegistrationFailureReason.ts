/**
 * - Purpose: map normalized SIP registration failure keys to Russian UI copy.
 * - Inputs: stable failure key from domain projection.
 * - Outputs: user-facing Russian error message.
 */
export function mapSipRegistrationFailureReason(key: string): string {
  switch (key) {
    case "authentication_error":
      return "Неверный логин или пароль";
    case "connection_error":
      return "Ошибка соединения с сервером";
    case "transport_connection_timed_out":
      return "Не удалось подключиться к серверу (таймаут 10 с)";
    case "registration_timeout":
      return "Истекло время ожидания регистрации";
    case "forbidden":
      return "Доступ запрещён";
    case "not_found":
      return "Учётная запись не найдена";
    case "service_unavailable":
      return "Сервис регистрации недоступен";
    case "sip_recovery_exhausted":
      return "Исчерпаны попытки автоматической регистрации";
    default:
      return "Ошибка регистрации SIP";
  }
}

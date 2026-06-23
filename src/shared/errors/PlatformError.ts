export type PlatformErrorCode =
  | "unknown"
  | "validation_failed"
  | "operation_failed"
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "timeout"
  | "cancelled";

export type PlatformError = Readonly<{
  code: PlatformErrorCode;
  message: string;
  cause?: unknown;
}>;

export function createPlatformError(
  code: PlatformErrorCode,
  message: string,
  cause?: unknown,
): PlatformError {
  if (cause === undefined) {
    return { code, message };
  }
  return { code, message, cause };
}

export function normalizeUnknownError(error: unknown): PlatformError {
  if (isPlatformError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return createPlatformError("unknown", error.message, error);
  }

  return createPlatformError("unknown", "An unknown error occurred", error);
}

export function isPlatformError(value: unknown): value is PlatformError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["code"] === "string" &&
    typeof candidate["message"] === "string"
  );
}

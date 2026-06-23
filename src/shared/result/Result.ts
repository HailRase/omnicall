import type { PlatformError } from "../errors/PlatformError.js";

export type Ok<TValue> = Readonly<{
  ok: true;
  value: TValue;
}>;

export type Err<TError extends PlatformError = PlatformError> = Readonly<{
  ok: false;
  error: TError;
}>;

export type Result<TValue, TError extends PlatformError = PlatformError> =
  | Ok<TValue>
  | Err<TError>;

export function ok<TValue>(value: TValue): Ok<TValue> {
  return { ok: true, value };
}

export function err<TError extends PlatformError>(
  error: TError,
): Err<TError> {
  return { ok: false, error };
}

export function isOk<TValue, TError extends PlatformError>(
  result: Result<TValue, TError>,
): result is Ok<TValue> {
  return result.ok;
}

export function isErr<TValue, TError extends PlatformError>(
  result: Result<TValue, TError>,
): result is Err<TError> {
  return !result.ok;
}

export function mapResult<TValue, TNext, TError extends PlatformError>(
  result: Result<TValue, TError>,
  mapper: (value: TValue) => TNext,
): Result<TNext, TError> {
  if (isErr(result)) {
    return result;
  }
  return ok(mapper(result.value));
}

export function mapError<TValue, TError extends PlatformError, TNext extends PlatformError>(
  result: Result<TValue, TError>,
  mapper: (error: TError) => TNext,
): Result<TValue, TNext> {
  if (isOk(result)) {
    return result;
  }
  return err(mapper(result.error));
}

export function unwrapOr<TValue, TError extends PlatformError>(
  result: Result<TValue, TError>,
  fallback: TValue,
): TValue {
  if (isOk(result)) {
    return result.value;
  }
  return fallback;
}

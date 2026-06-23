export type { CorrelationId } from "./correlation-id/index.js";
export { createCorrelationId, isCorrelationId } from "./correlation-id/index.js";
export type { PlatformError, PlatformErrorCode } from "./errors/index.js";
export {
  createPlatformError,
  isPlatformError,
  normalizeUnknownError,
} from "./errors/index.js";
export type { Err, Ok, Result } from "./result/index.js";
export {
  err,
  isErr,
  isOk,
  mapError,
  mapResult,
  ok,
  unwrapOr,
} from "./result/index.js";

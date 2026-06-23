import type { CorrelationId } from "@shared/correlation-id/index.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Readonly<{
  correlationId?: CorrelationId;
  featureId?: string;
  boundedContext?: string;
  operation?: string;
  previousState?: string;
  nextState?: string;
  result?: string;
  [key: string]: string | number | boolean | undefined;
}>;

export type LogEntry = Readonly<{
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: unknown;
  timestamp: string;
}>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext, error?: unknown): void;
  child(context: LogContext): Logger;
}

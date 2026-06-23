import type {
  LogContext,
  LogEntry,
  LogLevel,
  Logger,
} from "@ports/logging/Logger.js";

type LogSink = (entry: LogEntry) => void;

function mergeContext(
  base: LogContext | undefined,
  child: LogContext,
): LogContext {
  return { ...base, ...child };
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext | undefined,
  error?: unknown,
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context !== undefined ? { context } : {}),
    ...(error !== undefined ? { error } : {}),
  };
}

function write(
  sink: LogSink,
  level: LogLevel,
  message: string,
  context: LogContext | undefined,
  error?: unknown,
): void {
  sink(createLogEntry(level, message, context, error));
}

export function createLogger(
  sink: LogSink,
  baseContext?: LogContext,
): Logger {
  return {
    debug(message, context) {
      write(sink, "debug", message, mergeContext(baseContext, context ?? {}));
    },
    info(message, context) {
      write(sink, "info", message, mergeContext(baseContext, context ?? {}));
    },
    warn(message, context) {
      write(sink, "warn", message, mergeContext(baseContext, context ?? {}));
    },
    error(message, context, error) {
      write(
        sink,
        "error",
        message,
        mergeContext(baseContext, context ?? {}),
        error,
      );
    },
    child(context) {
      return createLogger(sink, mergeContext(baseContext, context));
    },
  };
}

export function createConsoleLogger(baseContext?: LogContext): Logger {
  const sink: LogSink = (entry) => {
    const payload = {
      ...entry.context,
      error: entry.error,
    };
    const method = entry.level === "debug" ? "debug" : entry.level;
    console[method](`[${entry.level}] ${entry.message}`, payload);
  };

  return createLogger(sink, baseContext);
}

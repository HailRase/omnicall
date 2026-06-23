import type { LogEntry, LogContext, Logger } from "@ports/logging/Logger.js";
import { createLogger } from "./ConsoleLogger.js";

export type TestLogger = Logger & {
  readonly entries: ReadonlyArray<LogEntry>;
  clear(): void;
};

export function createTestLogger(baseContext?: LogContext): TestLogger {
  const entries: LogEntry[] = [];
  const logger = createLogger((entry) => {
    entries.push(entry);
  }, baseContext);

  return {
    ...logger,
    get entries() {
      return [...entries];
    },
    clear() {
      entries.length = 0;
    },
  };
}

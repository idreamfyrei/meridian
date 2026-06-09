import pino, { type Logger, type LoggerOptions } from "pino";

export type LogContext = Record<string, string | number | boolean | undefined>;

let rootLogger: Logger | undefined;

function createLogger(): Logger {
  const options: LoggerOptions = {
    level: process.env.LOG_LEVEL ?? "info",
    base: {
      service: "meridian",
    },
  };

  return pino(options);
}

export function getLogger(context?: LogContext): Logger {
  rootLogger ??= createLogger();

  if (!context) {
    return rootLogger;
  }

  return rootLogger.child(context);
}

export function withRequestLogContext(
  requestId: string,
  context?: LogContext,
): Logger {
  return getLogger({
    requestId,
    ...context,
  });
}

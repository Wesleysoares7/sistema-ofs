type LogLevel = "debug" | "info" | "warn" | "error";

const isProduction = process.env.NODE_ENV === "production";

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minLevel: LogLevel = isProduction ? "info" : "debug";

function shouldLog(level: LogLevel) {
  return levelWeight[level] >= levelWeight[minLevel];
}

function write(level: LogLevel, message: string, ...meta: unknown[]) {
  if (!shouldLog(level)) return;

  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  if (level === "error") {
    console.error(prefix, message, ...meta);
    return;
  }

  if (level === "warn") {
    console.warn(prefix, message, ...meta);
    return;
  }

  console.log(prefix, message, ...meta);
}

export const logger = {
  debug: (message: string, ...meta: unknown[]) =>
    write("debug", message, ...meta),
  info: (message: string, ...meta: unknown[]) => write("info", message, ...meta),
  warn: (message: string, ...meta: unknown[]) => write("warn", message, ...meta),
  error: (message: string, ...meta: unknown[]) =>
    write("error", message, ...meta),
};

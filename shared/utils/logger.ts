type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  module?: string;
  correlationId?: string;
}

class Logger {
  constructor(private options: LoggerOptions = {}) {}

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const correlationIdPrefix = this.options.correlationId ? `${this.options.correlationId} ` : "";
    const modulePrefix = this.options.module ? `[${this.options.module}] ` : "";
    return `${timestamp} ${level.toUpperCase()} ${correlationIdPrefix}${modulePrefix}${message}`;
  }

  child(options: LoggerOptions): Logger {
    return new Logger({ ...this.options, ...options });
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatMessage("debug", message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info(this.formatMessage("info", message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage("warn", message), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage("error", message), ...args);
  }
}

export const logger = new Logger();

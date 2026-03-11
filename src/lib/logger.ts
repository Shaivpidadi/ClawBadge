import type { AppConfig } from "../config.js";

type LogLevel = AppConfig["logLevel"];

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

export class Logger {
  constructor(private readonly level: LogLevel) {}

  debug(event: string, data: Record<string, unknown> = {}): void {
    this.write("debug", event, data);
  }

  info(event: string, data: Record<string, unknown> = {}): void {
    this.write("info", event, data);
  }

  warn(event: string, data: Record<string, unknown> = {}): void {
    this.write("warn", event, data);
  }

  error(event: string, data: Record<string, unknown> = {}): void {
    this.write("error", event, data);
  }

  private write(level: LogLevel, event: string, data: Record<string, unknown>): void {
    if (levelPriority[level] < levelPriority[this.level]) {
      return;
    }

    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      event,
      ...data
    });

    if (level === "warn") {
      console.warn(payload);
      return;
    }

    if (level === "error") {
      console.error(payload);
      return;
    }

    console.log(payload);
  }
}

export function createLogger(config: AppConfig): Logger {
  return new Logger(config.logLevel);
}

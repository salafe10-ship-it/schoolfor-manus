// src/modules/logging/domain/LoggerService.ts
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context: Record<string, any>;
  correlationId?: string;
  tenantId?: string;
}

/**
 * Enterprise Logger Service.
 * Outputs structured JSON logs for centralized monitoring.
 */
export class LoggerService {
  public log(entry: LogEntry): void {
    const logPayload = {
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    };
    // In production, this would stream to a centralized logging service (e.g., Cloud Logging)
    console.log(JSON.stringify(logPayload));
  }

  public info(message: string, context: Record<string, any>, correlationId?: string): void {
    this.log({ timestamp: new Date(), level: LogLevel.INFO, message, context, correlationId });
  }

  public error(message: string, context: Record<string, any>, correlationId?: string): void {
    this.log({ timestamp: new Date(), level: LogLevel.ERROR, message, context, correlationId });
  }
}

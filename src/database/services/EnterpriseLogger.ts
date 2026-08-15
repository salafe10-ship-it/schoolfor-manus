export enum LogSeverity {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export interface StructuredLogPayload {
  timestamp: string;
  severity: LogSeverity;
  message: string;
  context?: string; // module/sub-module context
  metadata?: Record<string, any>;
  requestId?: string;
  correlationId?: string;
  user?: string;
  screen?: string;
  functionName?: string;
}

export interface LogAdapter {
  log(severity: LogSeverity, message: string, context?: string, metadata?: Record<string, any>, extra?: Partial<StructuredLogPayload>): void;
}

export class EnterpriseLogger {
  private static readonly CONTEXT = 'ERP-Enterprise';
  public static runtimeLogs: StructuredLogPayload[] = [];

  private static adapter: LogAdapter = {
    log(severity: LogSeverity, message: string, context?: string, metadata?: Record<string, any>, extra?: Partial<StructuredLogPayload>): void {
      const processMetadata = (obj: any): any => {
        if (!obj) return obj;
        if (obj instanceof Error) {
          return {
            name: obj.name,
            message: obj.message,
            stack: obj.stack,
            ...obj
          };
        }
        if (Array.isArray(obj)) {
          return obj.map(item => processMetadata(item));
        }
        if (typeof obj === 'object') {
          const result: Record<string, any> = {};
          for (const key of Object.keys(obj)) {
            result[key] = processMetadata(obj[key]);
          }
          return result;
        }
        return obj;
      };

      const serializedMetadata = metadata ? processMetadata(metadata) : undefined;

      const payload: StructuredLogPayload = {
        timestamp: new Date().toISOString(),
        severity,
        message,
        context: context || EnterpriseLogger.CONTEXT,
        metadata: serializedMetadata,
        ...extra
      };

      EnterpriseLogger.runtimeLogs.unshift(payload);
      if (EnterpriseLogger.runtimeLogs.length > 100) {
        EnterpriseLogger.runtimeLogs.pop();
      }

      if (process.env.NODE_ENV === 'production') {
        console.log(JSON.stringify(payload));
      } else {
        const prefix = `[${payload.severity}] [${payload.context}]`;
        const metaString = metadata ? ` | Meta: ${JSON.stringify(metadata)}` : '';
        const extraString = extra ? ` | Extra: ${JSON.stringify(extra)}` : '';
        
        switch (severity) {
          case LogSeverity.ERROR:
            console.error(`${prefix} ${message}${metaString}${extraString}`);
            break;
          case LogSeverity.WARN:
            console.warn(`${prefix} ${message}${metaString}${extraString}`);
            break;
          case LogSeverity.INFO:
          case LogSeverity.DEBUG:
          default:
            console.log(`${prefix} ${message}${metaString}${extraString}`);
            break;
        }
      }
    }
  };

  public static setAdapter(customAdapter: LogAdapter): void {
    this.adapter = customAdapter;
  }

  private static writeLog(
    severity: LogSeverity,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    extra?: Partial<StructuredLogPayload>
  ): void {
    this.adapter.log(severity, message, context, metadata, extra);
  }

  public static info(message: string, context?: string, metadata?: Record<string, any>, extra?: Partial<StructuredLogPayload>): void {
    this.writeLog(LogSeverity.INFO, message, context, metadata, extra);
  }

  public static warn(message: string, context?: string, metadata?: Record<string, any>, extra?: Partial<StructuredLogPayload>): void {
    this.writeLog(LogSeverity.WARN, message, context, metadata, extra);
  }

  public static error(message: string, context?: string, metadata?: Record<string, any>, extra?: Partial<StructuredLogPayload>): void {
    this.writeLog(LogSeverity.ERROR, message, context, metadata, extra);
  }

  public static debug(message: string, context?: string, metadata?: Record<string, any>): void {
    // Only logged in non-production environments to avoid production noise
    if (process.env.NODE_ENV !== 'production') {
      this.writeLog(LogSeverity.DEBUG, message, context, metadata);
    }
  }
}

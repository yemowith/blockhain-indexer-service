import winston, { format, Logger as WinstonLogger } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

export class Logger {
  private logger: WinstonLogger
  private context: string

  constructor(context: string) {
    this.context = context
    this.logger = this.createLogger()
  }

  private createLogger(): WinstonLogger {
    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
      format.printf(({ timestamp, level, message, context, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : ''
        return `${timestamp} [${level.toUpperCase()}] [${
          this.context
        }] ${message} ${metaStr}`
      }),
    )

    const logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { context: this.context },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, context, ...meta }) => {
              const metaStr = Object.keys(meta).length
                ? JSON.stringify(meta)
                : ''
              return `${timestamp} [${level}] [${this.context}] ${message} ${metaStr}`
            }),
          ),
        }),

        // Rotating file transport for all logs
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),

        // Separate file for error logs
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          zippedArchive: true,
        }),
      ],
    })

    // Handle uncaught exceptions and unhandled rejections
    logger.exceptions.handle(
      new DailyRotateFile({
        filename: 'logs/exceptions-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
      }),
    )

    return logger
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta)
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, meta)
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta)
  }

  public success(message: string, meta?: any): void {
    this.logger.info(message, meta)
  }

  public error(message: string, error?: Error | unknown, meta?: any): void {
    const errorMeta =
      error instanceof Error
        ? {
            error: {
              message: error.message,
              stack: error.stack,
              ...meta,
            },
          }
        : { error, ...meta }

    this.logger.error(message, errorMeta)
  }

  public fatal(message: string, error?: Error | unknown, meta?: any): void {
    const errorMeta =
      error instanceof Error
        ? {
            error: {
              message: error.message,
              stack: error.stack,
              ...meta,
            },
          }
        : { error, ...meta }

    this.logger.error(`FATAL: ${message}`, errorMeta)
  }
}

// Export default instance
export default Logger

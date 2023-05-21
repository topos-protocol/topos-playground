import { randomUUID } from 'crypto'
import * as winston from 'winston'

export const loggerConsole = winston.createLogger({
  level: 'info',
  format: winston.format.cli({ message: true }),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          return info.message
        })
      ),
    }),
  ],
})

export function createLoggerFile(logFilePath: string) {
  return winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
      new winston.transports.File({
        filename: logFilePath,
        format: winston.format.combine(winston.format.colorize()),
      }),
    ],
  })
}

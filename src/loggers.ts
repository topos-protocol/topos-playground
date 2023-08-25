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

function getLogConsole() {
  return globalThis.loggerConsoleVar
}

function getLogFile() {
  if (!globalThis.loggerFile)
    globalThis.loggerFile = createLoggerFile(
      globalThis.noLog ? '/dev/null' : globalThis.logFilePath
    )

  return globalThis.loggerFile
}

export function log(logMessage: string, overrideQuiet: boolean = false) {
  let lines = logMessage.split('\n')

  for (let line of lines) {
    if (overrideQuiet || !globalThis.quiet) {
      getLogConsole().info(line)
    }
    getLogFile().info(line)
  }
}

export function logError(errorMessage: string) {
  let lines = errorMessage.split('\n')

  for (let line of lines) {
    getLogConsole().error(line)
    getLogFile().error(line)
  }

  getLogConsole().error(`Find more details in ${globalThis.logFilePath}`)
  getLogFile().error(`Find more details in ${globalThis.logFilePath}`)
}

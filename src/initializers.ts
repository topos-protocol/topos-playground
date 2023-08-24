import { mkdir } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { config } from 'dotenv'

import { loggerConsole, logError } from './loggers'

config()

declare global {
  var verbose: boolean
  var quiet: boolean
  var noLog: boolean
  var workingDir: string
  var workingDirExists: boolean
  var logDir: string
  var executionPath: string
  var executionPathExists: boolean
  var loggerConsoleVar: typeof loggerConsole
  var logFilePath: string
  var loggerFile
}

export function initializeGlobals() {
  // Setup global configuration

  let home = process.env.HOME || '.'
  let dataHome = process.env.XDG_DATA_HOME || join(home, '.local', 'share')
  let stateHome = process.env.XDG_STATE_HOME || join(home, '.local', 'state')

  globalThis.workingDir = join(dataHome, 'topos-playground')
  globalThis.logDir = join(stateHome, 'topos-playground/logs')
  globalThis.loggerConsoleVar = loggerConsole
  globalThis.logFilePath = join(logDir, `log-${randomUUID()}.log`)
  globalThis.executionPath = join(
    globalThis.workingDir,
    'local-erc20-messaging-infra'
  )

  globalThis.loggerFile = false
}

export function initializeDirectories() {
  // Create the working directory if it does not exist
  mkdir(globalThis.workingDir, { recursive: true }, (error) => {
    if (error) {
      logError(`Could not create working directory (${globalThis.workingDir})`)
    }
  })

  // Create the log directory if it does not exist
  mkdir(globalThis.logDir, { recursive: true }, (error) => {
    if (error) {
      logError(`Could not create log directory (${globalThis.logDir})`)
    }
  })
}
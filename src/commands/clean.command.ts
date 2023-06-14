import { stat } from 'fs'
import { Command, CommandRunner } from 'nest-commander'
import { concatAll } from 'rxjs/operators'
import { defer, EMPTY, Observable, of } from 'rxjs'
import { homedir } from 'os'

import { Next, ReactiveSpawn } from '../ReactiveSpawn'
import { workingDir } from 'src/constants'
import { createLoggerFile, loggerConsole } from 'src/loggers'
import { randomUUID } from 'crypto'

@Command({
  name: 'clean',
  description: 'Clean artifacts from a previous start',
})
export class CleanCommand extends CommandRunner {
  private _workingDir = workingDir
  private _loggerConsole = loggerConsole
  private _logFilePath = `logs/log-${randomUUID()}.log`
  private _loggerFile = createLoggerFile(this._logFilePath)

  constructor(private _spawn: ReactiveSpawn) {
    super()
  }

  async run(): Promise<void> {
    this._log(`Welcome to Topos-Playground!`)
    this._log(``)

    of(
      this._verifyWorkingDirectoryExistence(),
      this._shutdownFullMsgProtocolInfra(),
      this._shutdownRedis(),
      this._removeWorkingDir()
    )
      .pipe(concatAll())
      .subscribe({
        complete: () => {
          this._log(`🧹 Everything is clean! 🧹`)
          this._log(`Logs were written to ${this._logFilePath}`)
        },
        error: () => {},
        next: (data: Next) => {
          if (data && data.hasOwnProperty('origin')) {
            if (data.origin === 'stderr') {
              this._loggerFile.error(data.output)
            } else if (data.origin === 'stdout') {
              this._loggerFile.info(data.output)
            }
          }
        },
      })
  }

  private _verifyWorkingDirectoryExistence() {
    return new Observable((subscriber) => {
      stat(this._workingDir, (error) => {
        if (error) {
          this._logError(
            `Working directory have not been found, nothing to clean!`
          )
          subscriber.error()
        } else {
          subscriber.complete()
        }
      })
    })
  }

  private _shutdownFullMsgProtocolInfra() {
    const executionPath = `${this._workingDir}/local-erc20-messaging-infra`

    return of(
      defer(() => of(this._log(`Shutting down the ERC20 messaging infra...`))),
      this._spawn.reactify(`cd ${executionPath} && docker compose down -v`),
      defer(() => of(this._log(`✅ subnets & TCE are down`), this._log(``)))
    ).pipe(concatAll())
  }

  private _shutdownRedis() {
    const containerName = 'redis-stack-server'

    return of(
      defer(() => of(this._log(`Shutting down the redis server...`))),
      this._spawn.reactify(`docker rm -f ${containerName}`),
      defer(() => of(this._log(`✅ redis is down`), this._log(``)))
    ).pipe(concatAll())
  }

  private _removeWorkingDir() {
    const homeDir = homedir()

    return of(
      defer(() => of(this._log(`Removing the working directory...`))),
      // Let's make sure we're not removing something we shouldn't
      this._workingDir.indexOf(homeDir) !== -1 && this._workingDir !== homeDir
        ? of(
            this._spawn.reactify(`rm -rf ${this._workingDir}`),
            defer(() =>
              of(
                this._log('✅ Working directory has been removed'),
                this._log(``)
              )
            )
          ).pipe(concatAll())
        : of(
            EMPTY,
            defer(() =>
              of(
                this._logError(
                  `Working directory (${this._workingDir}) is not safe for removal!`
                ),
                this._log(``)
              )
            )
          ).pipe(concatAll())
    ).pipe(concatAll())
  }

  private _log(logMessage: string) {
    this._loggerConsole.info(logMessage)
    this._loggerFile.info(logMessage)
  }

  private _logError(errorMessage: string) {
    this._loggerConsole.error(errorMessage)
    this._loggerFile.error(errorMessage)
    this._loggerConsole.error(`👉 Find more details in ${this._logFilePath}`)
  }
}

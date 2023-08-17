import { stat } from 'fs'
import { join } from 'path'

import { Command, CommandRunner } from 'nest-commander'
import { concatAll } from 'rxjs/operators'
import { defer, EMPTY, Observable, of } from 'rxjs'
import { homedir } from 'os'

import { Next, ReactiveSpawn } from '../ReactiveSpawn'
import { log, logError } from 'src/loggers'

@Command({
  name: 'clean',
  description: 'Clean artifacts from a previous start',
})
export class CleanCommand extends CommandRunner {
  constructor(private _spawn: ReactiveSpawn) {
    super()
  }

  async run(): Promise<void> {
    log(`Cleaning up Topos-Playground!`)
    log(``)

    of(
      this._verifyExecutionPathExistence(),
      this._verifyWorkingDirectoryExistence(),
      this._shutdownFullMsgProtocolInfra(),
      this._shutdownRedis(),
      this._removeworkingDir()
    )
      .pipe(concatAll())
      .subscribe({
        complete: () => {
          log(`🧹 Everything is clean! 🧹`)
          log(`Logs were written to ${globalThis.logFilePath}`)
        },
        error: () => {},
        next: (data: Next) => {
          if (data && data.hasOwnProperty('output')) {
            log(`${data.output}`)
          }
        },
      })
  }

  private _verifyWorkingDirectoryExistence() {
    return new Observable((subscriber) => {
      stat(globalThis.workingDir, (error) => {
        console.log("verify working directory existence")
        if (error) {
          logError(
            `The working directory (${globalThis.workingDir}) can not been found; nothing to clean!`
          )
          subscriber.error()
        } else {
          log(`Cleaning working directory (${globalThis.workingDir})...`)
          subscriber.complete()
        }
      })
    })
  }

  private _verifyExecutionPathExistence() {
    console.log(`verify execution path ${globalThis.executionPath}`)
    return new Observable((subscriber) => {
      stat(globalThis.executionPath, (error) => {
        console.log("verify execution path existence")
        if (error) {
          globalThis.executionPath_exists = false
          subscriber.complete()
        } else {
          globalThis.executionPath_exists = true
          subscriber.complete()
        }
      })
    })
  }

  private _shutdownFullMsgProtocolInfra() {
    console.log("do shutdown stuff")

    console.log("do return blah blah shutoff")
    return of(  
      defer(() => of(console.log("A*"))),
      defer(() => of(!globalThis.executionPath_exists ? log(`✅ ERC20 messaging infra is not running; subnets & TCE are down`) : null)),
      defer(() => of(globalThis.executionPath_exists ? log(`Shutting down the ERC20 messaging infra...`) : null)),
      defer(() => this._spawn.reactify(`cd ${globalThis.executionPath} && docker compose down -v`)),
      defer(() => of(log(`✅ subnets & TCE are down`), log(``)))
    ).pipe(concatAll())
  }

  private _shutdownRedis() {
    const containerName = 'redis-stack-server'
    let container_running = false

    return of(
      new Observable((subscriber) => {
        this._spawn.reactify(`docker ps --format '{{.Names}}' | grep ${containerName}`).subscribe({
          next: (data: Next) => {
            if (data && data.output && `${data.output}`.indexOf(containerName) !== -1) {
              container_running = true
            }
          },
          error: () => { subscriber.error() },
          complete: () => { subscriber.complete() }
        })
      }),
      defer(() => of(log(`Container running: ${container_running}`))),
      defer(() => of(log(container_running ? `✅ redis is not running; nothing to shut down` : `Shutting down the redis server...`))),
      new Observable((subscriber) => {
        this._spawn.reactify(`docker rm -f ${containerName}`).subscribe({
          next: (data: Next) => { subscriber.next(data) },
          error: (data) => { subscriber.error(data) },
          complete: () => { subscriber.complete() }
        })
      }),
      defer(() => of(log(container_running ? `✅ redis is down\n` : ``)))).pipe(concatAll())
  }

  private _removeworkingDir() {
    const homeDir = homedir()

    return of(
      defer(() => of(log(`Removing the working directory...`))),
      globalThis.workingDir.indexOf(homeDir) !== -1 && globalThis.workingDir !== homeDir
        ? of(
            this._spawn.reactify(`rm -rf ${globalThis.workingDir}`),
            defer(() =>
              of(
                log('✅ Working directory has been removed'),
                log(``)
              )
            )
          ).pipe(concatAll())
        : of(
            EMPTY,
            defer(() =>
              of(
                logError(
                  `Working directory (${globalThis.workingDir}) is not safe for removal!`
                ),
                log(``)
              )
            )
          ).pipe(concatAll())
    ).pipe(concatAll())
  }

}

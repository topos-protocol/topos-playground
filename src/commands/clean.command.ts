import { stat, readdir } from 'fs'
import { Command, CommandRunner } from 'nest-commander'
import { Observable, concat } from 'rxjs'
import { homedir } from 'os'

import { Next, ReactiveSpawn } from '../ReactiveSpawn'
import { log, logError } from '../loggers'

@Command({
  name: 'clean',
  description:
    'Shut down Playground docker containers, and clean up the working directory',
})
export class CleanCommand extends CommandRunner {
  constructor(private _spawn: ReactiveSpawn) {
    super()
  }

  async run(): Promise<void> {
    log(`Cleaning up Topos-Playground...`)
    log(``)

    this._verifyWorkingDirectoryExistence().subscribe(() => {
      this._verifyExecutionPathExistence().subscribe(() => {
        // Coordinate the steps to clean up the environment
        concat(
          this._shutdownFullMsgProtocolInfra(),
          this._shutdownRedis(),
          this._removeWorkingDirectory()
        ).subscribe()
      })
    })
  }

  private _verifyWorkingDirectoryExistence() {
    return new Observable((subscriber) => {
      stat(globalThis.workingDir, (error, stats) => {
        if (error) {
          globalThis.workingDirExists = false
          log(
            `Working directory (${globalThis.workingDir}) is not found; nothing to clean.`
          )
          subscriber.next()
          subscriber.complete()
        } else if (!stats.isDirectory()) {
          logError(
            `The working directory (${globalThis.workingDir}) is not a directory; this is an error!`
          )
          globalThis.workingDirExists = false
          subscriber.error()
        } else {
          readdir(globalThis.workingDir, (err, files) => {
            if (err) {
              globalThis.workingDirExists = false
              logError(
                `Error while trying to read the working directory (${globalThis.workingDir})`
              )
              subscriber.error()
            }

            if (files.length === 0) {
              globalThis.workingDirExists = false
              log(
                `Working directory (${globalThis.workingDir}) is empty; nothing to clean.`
              )
              subscriber.next()
              subscriber.complete()
            } else {
              globalThis.workingDirExists = true
              log(`Found working directory (${globalThis.workingDir})`)
              subscriber.next()
              subscriber.complete()
            }
          })
        }
      })
    })
  }

  private _verifyExecutionPathExistence() {
    return new Observable((subscriber) => {
      stat(globalThis.executionPath, (error) => {
        if (error) {
          globalThis.executionPathExists = false
          log(`Execution path (${globalThis.executionPath}) not found`)
          subscriber.next()
          subscriber.complete()
        } else {
          globalThis.executionPathExists = true
          log(`Found execution path (${globalThis.executionPath})`)
          subscriber.next()
          subscriber.complete()
        }
      })
    })
  }

  private _shutdownFullMsgProtocolInfra() {
    return new Observable((subscriber) => {
      log('')
      if (globalThis.executionPathExists) {
        log(`Shutting down the ERC20 messaging infra...`)
        this._spawn
          .reactify(`cd ${globalThis.executionPath} && docker compose down -v`)
          .subscribe({
            next: (data: Next) => {
              subscriber.next(data)
            },
            error: (data) => {
              subscriber.error(data)
            },
            complete: () => {
              subscriber.complete()
            },
          })
        log(`✅ subnets & TCE are down`)
      } else {
        log(`✅ ERC20 messaging infra is not running; subnets & TCE are down`)
        subscriber.complete()
      }
    })
  }

  private _shutdownRedis() {
    const containerName = 'redis-stack-server'
    let containerRunning = false

    return new Observable((subscriber) => {
      concat(
        new Observable((innerSubscriber) => {
          this._spawn
            .reactify(`docker ps --format '{{.Names}}' | grep ${containerName}`)
            .subscribe({
              next: (data: Next) => {
                if (
                  data &&
                  data.output &&
                  `${data.output}`.indexOf(containerName) !== -1
                ) {
                  containerRunning = true
                }
              },
              error: () => {
                containerRunning = false
                innerSubscriber.complete() /* grep returns an error code 1 if a pattern is missing */
              },
              complete: () => {
                innerSubscriber.complete()
              },
            })
        }),
        new Observable((innerSubscriber) => {
          log('')
          if (containerRunning) {
            log(`Shutting down the redis server...`)

            this._spawn.reactify(`docker rm -f ${containerName}`).subscribe({
              next: (data: Next) => {
                innerSubscriber.next(data)
              },
              complete: () => {
                innerSubscriber.complete()
              },
            })
            log(`✅ redis is down`)
          } else {
            log(`✅ redis is not running; nothing to shut down`)
          }
          innerSubscriber.complete()
        })
      ).subscribe(subscriber)
    })
  }

  private _removeWorkingDirectory() {
    const homeDir = homedir()
    return new Observable((subscriber) => {
      if (
        globalThis.workingDirExists &&
        globalThis.workingDir.indexOf(homeDir) !== -1 &&
        globalThis.workingDir !== homeDir
      ) {
        log('')
        log(`Cleaning up the working directory (${globalThis.workingDir})`)
        this._spawn.reactify(`rm -rf ${globalThis.workingDir}`).subscribe()
        log('✅ Working directory has been removed')
      }
    })
  }
}

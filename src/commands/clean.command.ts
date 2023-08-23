import { stat, readdir } from 'fs'
import { Command, CommandRunner } from 'nest-commander'
import { Observable, concat } from 'rxjs'
import { homedir } from 'os'

import { Next, ReactiveSpawn } from '../ReactiveSpawn'
import { log, logError } from '../loggers'

@Command({
  name: 'clean',
  description: 'Shut down Playground docker containers, and clean up the working directory',
})
export class CleanCommand extends CommandRunner {
  constructor(private _spawn: ReactiveSpawn) {
    super()
  }

  async run(): Promise<void> {
    log(`Cleaning up Topos-Playground...`)
    log(``)

    this._verifyWorkingDirectoryExistence().subscribe((working_dir_flag) => {
      if (working_dir_flag) {
        log(`Found working directory (${globalThis.workingDir})`)
      } else {
        log(`Working directory (${globalThis.workingDir}) empty or not found`)
      }

      this._verifyExecutionPathExistence().subscribe((execution_path_flag) => {
        if (execution_path_flag) {
          log(`Found execution path (${globalThis.executionPath})`)
        } else {
          log(`Execution path (${globalThis.executionPath}) not found`)
        }

        // Coordinate the steps to clean up the environment
        concat(
          this._shutdownFullMsgProtocolInfra(),
          this._shutdownRedis(),
          this._removeWorkingDirectory()
        ).subscribe({
          next: () => {  },
          complete: () => {  },
          error: () => {  }
        })
      })
    })
  }

  private _verifyWorkingDirectoryExistence() {
    return new Observable((subscriber) => {
      stat(globalThis.workingDir, (error, stats) => {        
        if (error) {
          logError(
            `The working directory (${globalThis.workingDir}) can not been found; nothing to clean!`
          )
          globalThis.workingDirExists = false
          subscriber.next(false)
        } else if (!stats.isDirectory()) {
          logError(
            `The working directory (${globalThis.workingDir}) is not a directory; this is an error!`
          )
          globalThis.workingDirExists = false
          subscriber.error();
        } else {
          readdir(globalThis.workingDir, (err, files) => {
            if (err) {
              globalThis.workingDirExists = false
              subscriber.error();
            }
    
            if (files.length === 0) {
              globalThis.workingDirExists = false
              subscriber.next(false)
            } else {
              globalThis.workingDirExists = true
              subscriber.next(true)
            }
          });

        }
      })
    })
  }

  private _verifyExecutionPathExistence() {
    return new Observable((subscriber) => {
      stat(globalThis.executionPath, (error) => {
        if (error) {
          globalThis.executionPathExists = false
          subscriber.next(false)
        } else {
          globalThis.executionPathExists = true
          subscriber.next(true)
        }
      })
    })
  }

  private _shutdownFullMsgProtocolInfra() {
    return new Observable((subscriber) => {
      if (globalThis.executionPathExists) {
        log(`\nShutting down the ERC20 messaging infra...`)
        this._spawn.reactify(`cd ${globalThis.executionPath} && docker compose down -v`).subscribe({
          next: (data: Next) => { subscriber.next(data) },
          error: (data) => { subscriber.error(data) },
          complete: () => { subscriber.complete() }
        })
        log(`✅ subnets & TCE are down`)
      } else {
        log(`\n✅ ERC20 messaging infra is not running; subnets & TCE are down`)
      }

    })
  }

  private _shutdownRedis() {
    const containerName = 'redis-stack-server'
    let container_running = false

    return new Observable((subscriber) => {
      concat(
        new Observable((inner_subscriber) => {
          this._spawn.reactify(`docker ps --format '{{.Names}}' | grep ${containerName}`).subscribe({
            next: (data: Next) => {
              if (data && data.output && `${data.output}`.indexOf(containerName) !== -1) {
                container_running = true
              }
            },
            error: () => { container_running = false; inner_subscriber.complete() /* grep returns an error code 1 if a pattern is missing */ },
            complete: () => { inner_subscriber.complete() }
          })
        }),
        new Observable((inner_subscriber) => {
          if (container_running) {
            log(`\nShutting down the redis server...`)

            this._spawn.reactify(`docker rm -f ${containerName}`).subscribe({
              next: (data: Next) => { inner_subscriber.next(data) },
              complete: () => { inner_subscriber.complete() }
            })
            log(`✅ redis is down`)
          } else {
            log(`\n ✅ redis is not running; nothing to shut down`)
          }
        }),
        new Observable((inner_subscriber) => {
          inner_subscriber.complete()
        })
      ).subscribe({
        next: (data: Next) => { subscriber.next(data) },
        error: () => { subscriber.error() },
        complete: () => { subscriber.complete() }
      })
    })
  }

  private _removeWorkingDirectory() {
    const homeDir = homedir()
    return new Observable((subscriber) => {
      if (globalThis.workingDirExists && globalThis.workingDir.indexOf(homeDir) !== -1 && globalThis.workingDir !== homeDir) {
        log(`\nCleaning up the working directory (${globalThis.workingDir})`)
        this._spawn.reactify(`rm -rf ${globalThis.workingDir}`).subscribe({
          next: (data: Next) => { subscriber.next(data) },
          complete: () => { subscriber.complete() }
        })
        log('✅ Working directory has been removed')
      }
    })
  }
}
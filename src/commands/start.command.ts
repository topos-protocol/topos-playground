import { randomUUID } from 'crypto'
import { readFile, stat, writeFile } from 'fs'
import { Command, CommandRunner, InquirerService } from 'nest-commander'
import { concatAll, tap } from 'rxjs/operators'
import { defer, Observable, of } from 'rxjs'

import { Next, ReactiveSpawn } from '../ReactiveSpawn'
import { SecretAnswers } from '../questions/secrets.questions'
import { workingDir } from 'src/constants'
import { createLoggerFile, loggerConsole } from 'src/loggers'

@Command({ name: 'start', description: 'Run everything' })
export class StartCommand extends CommandRunner {
  private _workingDir = workingDir
  private _loggerConsole = loggerConsole
  private _logFilePath = `logs/log-${randomUUID()}.log`
  private _loggerFile = createLoggerFile(this._logFilePath)

  constructor(
    private _spawn: ReactiveSpawn,
    private readonly inquirer: InquirerService
  ) {
    super()
  }

  async run(): Promise<void> {
    this._log(`Welcome to Topos-Playground!`)
    this._log(``)

    of(
      this._verifyDependencyInstallation(),
      this._createWorkingDirectoryIfInexistant(),
      this._cloneGitRepositories(),
      this._copyEnvFiles(),
      this._verifySecrets(),
      this._runFullMsgProtocolInfra(),
      this._runRedis(),
      this._runExecutorService(),
      this._rundDappFrontendService()
    )
      .pipe(concatAll())
      .subscribe({
        complete: () => {
          this._log(`🔥 Everything is done! 🔥`)
          this._log(``)
          this._log(
            `🚀 Start sending ERC20 tokens across subnet by accessing the dApp Frontend at http://localhost:3001`
          )
          this._log(``)
          this._log(
            `ℹ️  Ctrl/cmd-c will shut down the dApp Frontend and the Executor Service BUT will keep subnets and the TCE running (use the clean command to shut them down)`
          )
          this._log(`ℹ️  Logs were written to ${this._logFilePath}`)
        },
        error: () => {
          this._logError(`❌ Error`)
        },
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

  private _verifyDependencyInstallation() {
    return of(
      defer(() => of(this._log('Verifying dependency installation...'))),
      this._verifyDockerInstallation(),
      this._verifyGitInstallation(),
      this._verifyNodeJSInstallation(),
      defer(() => of(this._log('')))
    ).pipe(concatAll())
  }

  private _verifyDockerInstallation() {
    return of(
      this._spawn.reactify('docker --version'),
      defer(() => of(this._log('✅ Docker')))
    ).pipe(concatAll())
  }

  private _verifyGitInstallation() {
    return of(
      this._spawn.reactify('git --version'),
      defer(() => of(this._log('✅ Git')))
    ).pipe(concatAll())
  }

  private _verifyNodeJSInstallation() {
    return of(
      this._spawn.reactify('node --version'),
      defer(() => of(this._log('✅ NodeJS')))
    ).pipe(concatAll())
  }

  private _createWorkingDirectoryIfInexistant() {
    return new Observable((subscriber) => {
      this._log(`Verifying working directory: [${this._workingDir}]...`)

      stat(this._workingDir, (error) => {
        if (error) {
          this._spawn
            .reactify(`mkdir -p ${this._workingDir}`)
            .pipe(
              tap({
                complete: () => {
                  this._log(`✅ Working directory was successfully created`)
                },
              })
            )
            .subscribe(subscriber)
        } else {
          this._log(`✅ Working directory exists`)
          subscriber.complete()
        }
      })
    }).pipe(
      tap({
        complete: () => {
          this._log('')
        },
      })
    )
  }

  private _cloneGitRepositories() {
    return of(
      defer(() => of(this._log('Cloning repositories...'))),
      this._cloneGitRepository(
        'toposware',
        'full-msg-protocol-infra',
        '0.1.0-alpha'
      ),
      this._cloneGitRepository(
        'toposware',
        'dapp-frontend-cross-subnet',
        '0.1.0-alpha'
      ),
      this._cloneGitRepository('toposware', 'executor-service', '0.1.0-alpha'),
      defer(() => of(this._log('')))
    ).pipe(concatAll())
  }

  private _cloneGitRepository(
    organizationName: string,
    repositoryName: string,
    branch?: string
  ) {
    return new Observable((subscriber) => {
      const path = `${this._workingDir}/${repositoryName}`

      stat(path, (error) => {
        if (error) {
          this._spawn
            .reactify(
              `git clone --depth 1 ${
                branch ? `--branch ${branch}` : ''
              } git@github.com:${organizationName}/${repositoryName}.git ${
                this._workingDir
              }/${repositoryName}`
            )
            .pipe(
              tap({
                complete: () => {
                  this._log(
                    `✅ ${repositoryName}${
                      branch ? ` | ${branch}` : ''
                    } successfully cloned`
                  )
                },
              })
            )
            .subscribe(subscriber)
        } else {
          this._log(
            `✅ ${repositoryName}${branch ? ` | ${branch}` : ''} already cloned`
          )
          subscriber.complete()
        }
      })
    })
  }

  private _copyEnvFiles() {
    return of(
      defer(() => of(this._log('Copying .env files across repositories...'))),
      this._copyEnvFile(
        '.env.dapp-frontend',
        `${this._workingDir}/dapp-frontend-cross-subnet/packages/frontend`
      ),
      this._copyEnvFile(
        '.env.dapp-backend',
        `${this._workingDir}/dapp-frontend-cross-subnet/packages/backend`
      ),
      this._copyEnvFile(
        '.env.executor-service',
        `${this._workingDir}/executor-service`
      ),
      defer(() => of(this._log('')))
    ).pipe(concatAll())
  }

  private _copyEnvFile(localEnvFileName: string, destinationDirectory: string) {
    return new Observable((subscriber) => {
      const destinationFileName = '.env'
      const destinationFilePath = `${destinationDirectory}/${destinationFileName}`

      stat(destinationFilePath, (error) => {
        if (error) {
          const localPathRoot = 'env'

          readFile(
            `${__dirname}/../../src/${localPathRoot}/${localEnvFileName}`,
            (_, fileContent) => {
              this._spawn
                .reactify(`echo "${fileContent}" >> ${destinationFilePath}`)
                .pipe(
                  tap({
                    complete: () => {
                      this._log(`✅ ${localEnvFileName} copied`)
                    },
                  })
                )
                .subscribe(subscriber)
            }
          )
        } else {
          this._log(`✅ ${localEnvFileName} already existing`)
          subscriber.complete()
        }
      })
    })
  }

  private _verifySecrets() {
    return new Observable((subscriber) => {
      this._log(`Setting secrets...`)

      const path = `${this._workingDir}/.env.secrets`

      stat(path, (error) => {
        if (error) {
          this._log(`No secrets file have been found so one will be created`)
          this._log(``)
          this._askForSecrets().subscribe(subscriber)
        } else {
          this._log(`✅ A local secrets file has been found and will be used`)
          this._log(``)
          subscriber.complete()
        }
      })
    })
  }

  private _askForSecrets() {
    return new Observable((subscriber) => {
      this.inquirer
        .ask<SecretAnswers>('secrets-questions', undefined)
        .then(
          ({
            privateKey,
            tokenDeployerSalt,
            toposCoreSalt,
            toposCoreProxySalt,
            toposMessagingSalt,
            subnetRegistratorSalt,
            auth0ClientId,
            auth0ClientSecret,
          }) => {
            writeFile(
              `${this._workingDir}/.env.secrets`,
              `export PRIVATE_KEY=${privateKey}
               export TOKEN_DEPLOYER_SALT=${tokenDeployerSalt}
               export TOPOS_CORE_SALT=${toposCoreSalt}
               export TOPOS_CORE_PROXY_SALT=${toposCoreProxySalt}
               export TOPOS_MESSAGING_SALT=${toposMessagingSalt}
               export SUBNET_REGISTRATOR_SALT=${subnetRegistratorSalt}
               export AUTH0_CLIENT_ID=${auth0ClientId}
               export AUTH0_CLIENT_SECRET=${auth0ClientSecret}
          `,
              () => {
                this._log(``)
                subscriber.complete()
              }
            )
          }
        )
    })
  }

  private _runFullMsgProtocolInfra() {
    const secretsFilePath = `${this._workingDir}/.env.secrets`
    const executionPath = `${this._workingDir}/full-msg-protocol-infra`

    return of(
      defer(() => of(this._log(`Running the full message protocol infra...`))),
      this._spawn.reactify(
        `source ${secretsFilePath} && cd ${executionPath} && docker compose up -d`
      ),
      defer(() => of(this._log(`✅ Subnets & TCE are running`), this._log(``)))
    ).pipe(concatAll())
  }

  private _runRedis() {
    const containerName = 'redis-stack-server'

    return of(
      defer(() => of(this._log(`Running the redis server...`))),
      this._spawn.reactify(
        `docker start ${containerName} 2>/dev/null || docker run -d --name ${containerName} -p 6379:6379 redis/redis-stack-server:latest`
      ),
      defer(() => of(this._log(`✅ redis is running`), this._log(``)))
    ).pipe(concatAll())
  }

  private _runExecutorService() {
    const secretsFilePath = `${this._workingDir}/.env.secrets`
    const executionPath = `${this._workingDir}/executor-service`

    return of(
      defer(() => of(this._log(`Running the Executor Service...`))),
      this._npmInstall(executionPath),
      this._startExecutorService(secretsFilePath, executionPath),
      defer(() => of(this._log(``)))
    ).pipe(concatAll())
  }

  private _npmInstall(executionPath: string) {
    return this._spawn.reactify(`cd ${executionPath} && npm install`).pipe(
      tap({
        complete: () => {
          this._log(`✅ Deps are installed`)
        },
      })
    )
  }

  private _startExecutorService(
    secretsFilePath: string,
    executionPath: string
  ) {
    return this._spawn
      .reactify(
        `source ${secretsFilePath} && cd ${executionPath} && npm start`,
        { runInBackground: true }
      )
      .pipe(
        tap({
          complete: () => {
            this._log(`✅ Web server is running`)
          },
        })
      )
  }

  private _rundDappFrontendService() {
    const secretsFilePath = `${this._workingDir}/.env.secrets`
    const executionPath = `${this._workingDir}/dapp-frontend-cross-subnet`

    return of(
      defer(() => of(this._log(`Running the dApp Frontend...`))),
      this._npmInstall(executionPath),
      this._buildDappFrontend(secretsFilePath, executionPath),
      this._startDappFrontend(secretsFilePath, executionPath),
      defer(() => of(this._log(``)))
    ).pipe(concatAll())
  }

  private _buildDappFrontend(secretsFilePath: string, executionPath: string) {
    return this._spawn
      .reactify(
        `source ${secretsFilePath} && cd ${executionPath} && npm run frontend:build`
      )
      .pipe(
        tap({
          complete: () => {
            this._log(`✅ Static files are built`)
          },
        })
      )
  }

  private _startDappFrontend(secretsFilePath: string, executionPath: string) {
    return this._spawn
      .reactify(
        `source ${secretsFilePath} && cd ${executionPath} && npm run backend:start`,
        { runInBackground: true }
      )
      .pipe(
        tap({
          complete: () => {
            this._log(`✅ Web server is running`)
          },
        })
      )
  }

  private _log(logMessage: string) {
    this._loggerConsole.info(logMessage)
    this._loggerFile.info(logMessage)
  }

  private _logError(errorMessage: string) {
    this._loggerConsole.error(errorMessage)
    this._loggerConsole.error(`Find more details in ${this._logFilePath}`)
  }
}

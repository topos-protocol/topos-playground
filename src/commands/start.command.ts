import { readFile, stat } from 'fs'
import { Command, CommandRunner, InquirerService } from 'nest-commander'
import { concatAll, tap } from 'rxjs/operators'
import { defer, Observable, of } from 'rxjs'

import { Next, ReactiveSpawn } from '../ReactiveSpawn'
import { log, logError } from '../loggers'

const INFRA_REF = 'v0.1.5'
const FRONTEND_REF = 'v0.1.0-alpha3'
const EXECUTOR_SERVICE_REF = 'v0.1.1'

@Command({ name: 'start', description: 'Verify that all dependencies are installed, clone any needed repositories, setup the environment, and start all of the docker containers for the Playground' })
export class StartCommand extends CommandRunner {

  constructor(
    private _spawn: ReactiveSpawn,
    private readonly inquirer: InquirerService
  ) {
    super()
  }

  async run(): Promise<void> {
    log(`Starting Topos-Playground...`)
    log(``)

    of(
      this._verifyDependencyInstallation(),
      this._createWorkingDirectoryIfInexistant(),
      this._cloneGitRepositories(),
      this._copyEnvFiles(),
      this._runLocalERC20MessagingInfra(),
      this._retrieveAndWriteContractAddressesToEnv(),
      this._runRedis(),
      this._runExecutorService(),
      this._rundDappFrontendService()
    )
      .pipe(concatAll())
      .subscribe({
        complete: () => {
          log(`🔥 Everything is done! 🔥`)
          log(``)
          log(
            `🚀 Start sending ERC20 tokens across subnet by accessing the dApp Frontend at http://localhost:3001`
          )
          log(``)
          log(
            `ℹ️  Ctrl/cmd-c will shut down the dApp Frontend and the Executor Service BUT will keep subnets and the TCE running (use the clean command to shut them down)`
          )
          log(`ℹ️  Logs were written to ${logFilePath}`)
        },
        error: () => {
          logError(`❌ Error`)
        },
        next: (data: Next) => {
          if (data && data.hasOwnProperty('output')) {
            log(`${data.output}`)
          }
        },
      })
  }

  private _verifyDependencyInstallation() {
    return of(
      defer(() => of(log('Verifying dependency installation...'))),
      this._verifyDockerInstallation(),
      this._verifyGitInstallation(),
      this._verifyNodeJSInstallation(),
      defer(() => of(log('')))
    ).pipe(concatAll())
  }

  private _verifyDockerInstallation() {
    let output = null
  
    return of(
      new Observable((subscriber) => {
        this._spawn.reactify('docker --version').subscribe({
          next: (data: Next) => {
            output = data
            subscriber.next('')
          },
          error: () => { subscriber.error() },
          complete: () => { subscriber.complete() },
        })
      }),
      defer(() => of(
        output.orign === 'stderr' ?
          log(`❌ Docker is not installed!`) :
          log(`✅ Docker`), log(`   ${output.output}`))),
    ).pipe(concatAll())
  }

  private _verifyGitInstallation() {
    return of(
      this._spawn.reactify('git --version'),
      defer(() => of(log('✅ Git')))
    ).pipe(concatAll())
  }

  private _verifyNodeJSInstallation() {
    return of(
      this._spawn.reactify('node --version'),
      defer(() => of(log('✅ NodeJS')))
    ).pipe(concatAll())
  }

  private _createWorkingDirectoryIfInexistant() {
    return new Observable((subscriber) => {
      log(`Verifying working directory: [${globalThis.workingDir}]...`)

      stat(globalThis.workingDir, (error) => {
        if (error) {
          this._spawn
            .reactify(`mkdir -p ${globalThis.workingDir}`)
            .pipe(
              tap({
                complete: () => {
                  log(`✅ Working directory was successfully created`)
                },
              })
            )
            .subscribe(subscriber)
        } else {
          log(`✅ Working directory exists`)
          subscriber.complete()
        }
      })
    }).pipe(
      tap({
        complete: () => {
          log('')
        },
      })
    )
  }

  private _cloneGitRepositories() {
    return of(
      defer(() => of(log('Cloning repositories...'))),
      this._cloneGitRepository(
        'topos-protocol',
        'local-erc20-messaging-infra',
        INFRA_REF
      ),
      this._cloneGitRepository(
        'topos-protocol',
        'dapp-frontend-erc20-messaging',
        FRONTEND_REF
      ),
      this._cloneGitRepository(
        'topos-protocol',
        'executor-service',
        EXECUTOR_SERVICE_REF
      ),
      defer(() => of(log('')))
    ).pipe(concatAll())
  }

  private _cloneGitRepository(
    organizationName: string,
    repositoryName: string,
    branch?: string
  ) {
    return new Observable((subscriber) => {
      const path = `${globalThis.workingDir}/${repositoryName}`

      stat(path, (error) => {
        if (error) {
          this._spawn
            .reactify(
              `git clone --depth 1 ${
                branch ? `--branch ${branch}` : ''
              } git@github.com:${organizationName}/${repositoryName}.git ${
                globalThis.workingDir
              }/${repositoryName}`
            )
            .pipe(
              tap({
                complete: () => {
                  log(
                    `✅ ${repositoryName}${
                      branch ? ` | ${branch}` : ''
                    } successfully cloned`
                  )
                },
              })
            )
            .subscribe(subscriber)
        } else {
          log(
            `✅ ${repositoryName}${branch ? ` | ${branch}` : ''} already cloned`
          )
          subscriber.complete()
        }
      })
    })
  }

  private _copyEnvFiles() {
    return of(
      defer(() => of(log('Copying .env files across repositories...'))),
      this._copyEnvFile(
        '.env.dapp-frontend',
        `${globalThis.workingDir}/dapp-frontend-erc20-messaging/packages/frontend`
      ),
      this._copyEnvFile(
        '.env.dapp-backend',
        `${globalThis.workingDir}/dapp-frontend-erc20-messaging/packages/backend`
      ),
      this._copyEnvFile(
        '.env.executor-service',
        `${globalThis.workingDir}/executor-service`
      ),
      this._copyEnvFile('.env.secrets', `${globalThis.workingDir}`, `.env.secrets`),
      defer(() => of(log('')))
    ).pipe(concatAll())
  }

  private _copyEnvFile(
    localEnvFileName: string,
    destinationDirectory: string,
    destinationFileName = '.env'
  ) {
    return new Observable((subscriber) => {
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
                      log(`✅ ${localEnvFileName} copied`)
                    },
                  })
                )
                .subscribe(subscriber)
            }
          )
        } else {
          log(`✅ ${localEnvFileName} already existing`)
          subscriber.complete()
        }
      })
    })
  }

  private _runLocalERC20MessagingInfra() {
    const secretsFilePath = `${globalThis.workingDir}/.env.secrets`
    const executionPath = `${globalThis.workingDir}/local-erc20-messaging-infra`

    return of(
      defer(() => of(log(`Running the ERC20 messaging infra...`))),
      this._spawn.reactify(
        `source ${secretsFilePath} && cd ${executionPath} && docker compose up -d`
      ),
      defer(() => of(log(`✅ Subnets & TCE are running`), log(``)))
    ).pipe(concatAll())
  }

  private _retrieveAndWriteContractAddressesToEnv() {
    const frontendEnvFilePath = `${globalThis.workingDir}/dapp-frontend-erc20-messaging/packages/frontend/.env`
    const executorServiceEnvFilePath = `${globalThis.workingDir}/executor-service/.env`

    return of(
      defer(() => of(log(`Retrieving contract addresses...`))),
      this._spawn.reactify(
        `docker cp contracts-topos:/contracts/.env ${globalThis.workingDir}/.env.addresses`
      ),
      this._spawn.reactify(
        `source ${globalThis.workingDir}/.env.addresses \
        && echo "VITE_SUBNET_REGISTRATOR_CONTRACT_ADDRESS=$SUBNET_REGISTRATOR_CONTRACT_ADDRESS" >> ${frontendEnvFilePath} \
        && echo "VITE_TOPOS_CORE_CONTRACT_ADDRESS=$TOPOS_CORE_PROXY_CONTRACT_ADDRESS" >> ${frontendEnvFilePath} \
        && echo "VITE_ERC20_MESSAGING_CONTRACT_ADDRESS=$ERC20_MESSAGING_CONTRACT_ADDRESS" >> ${frontendEnvFilePath} \
        && echo "SUBNET_REGISTRATOR_CONTRACT_ADDRESS=$SUBNET_REGISTRATOR_CONTRACT_ADDRESS" >> ${executorServiceEnvFilePath} \
        && echo "TOPOS_CORE_CONTRACT_ADDRESS=$TOPOS_CORE_PROXY_CONTRACT_ADDRESS" >> ${executorServiceEnvFilePath}`
      ),
      defer(() =>
        of(
          log(
            `✅ Contract addresses were retrieved and written to env files`
          ),
          log(``)
        )
      )
    ).pipe(concatAll())
  }

  private _runRedis() {
    const containerName = 'redis-stack-server'

    return of(
      defer(() => of(log(`Running the redis server...`))),
      this._spawn.reactify(
        `docker start ${containerName} 2>/dev/null || docker run -d --name ${containerName} -p 6379:6379 redis/redis-stack-server:latest`
      ),
      defer(() => of(log(`✅ redis is running`), log(``)))
    ).pipe(concatAll())
  }

  private _runExecutorService() {
    const secretsFilePath = `${globalThis.workingDir}/.env.secrets`
    const executionPath = `${globalThis.workingDir}/executor-service`

    return of(
      defer(() => of(log(`Running the Executor Service...`))),
      this._npmInstall(executionPath),
      this._startExecutorService(secretsFilePath, executionPath),
      defer(() => of(log(``)))
    ).pipe(concatAll())
  }

  private _npmInstall(executionPath: string) {
    return this._spawn.reactify(`cd ${executionPath} && npm install`).pipe(
      tap({
        complete: () => {
          log(`✅ Deps are installed`)
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
            log(`✅ Web server is running`)
          },
        })
      )
  }

  private _rundDappFrontendService() {
    const secretsFilePath = `${globalThis.workingDir}/.env.secrets`
    const executionPath = `${globalThis.workingDir}/dapp-frontend-erc20-messaging`

    return of(
      defer(() => of(log(`Running the dApp Frontend...`))),
      this._npmInstall(executionPath),
      this._buildDappFrontend(secretsFilePath, executionPath),
      this._startDappFrontend(secretsFilePath, executionPath),
      defer(() => of(log(``)))
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
            log(`✅ Static files are built`)
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
            log(`✅ Web server is running`)
          },
        })
      )
  }

}

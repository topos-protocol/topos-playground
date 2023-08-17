const { version, description } = require('../../package.json');

import { breakText } from 'src/utility'
import { RootCommand, Option, CommandRunner } from 'nest-commander'

import { ReactiveSpawn } from '../ReactiveSpawn'
import { log } from 'src/loggers'

@RootCommand({
  description: `${breakText(description)}\n`,
})
  
export class NewRootCommand extends CommandRunner {
  constructor(private _spawn: ReactiveSpawn) {

    super()
  }

  async run(): Promise<void> {
  }

  @Option({
    flags: '--version',
    description: `Show topos-playground version (v${version})`,
  })
  doVersion() {
    log((globalThis.quiet ? '' : 'topos-playground version ') + version, true)
    log(``)
  }

  @Option({
    flags: '-v, --verbose',
    description: breakText(`Show more information about the execution of a command`, 39),
  })
  doVerbose() {
    globalThis.verbose = true
  }

  @Option({
    flags: '-q, --quiet',
    description: breakText(`Show minimal onscreen information about the execution of a command`, 39),
  })
  doQuiet() {
    globalThis.quiet = true
  }

  @Option({
    flags: '-n, --no-log',
    description: `Do not write a log file`,
  })
  doNoLog() {
    globalThis.no_log = true
  }

}

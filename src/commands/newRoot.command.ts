import { breakText } from 'src/utility'
import { RootCommand, Option, CommandRunner } from 'nest-commander'

import { ReactiveSpawn } from '../ReactiveSpawn'
import { log } from '../loggers'
const { version, description } = require('../../package.json');

const helptext = `

Configuration

topos-playground follows the XDG Base Directory Specification, which means that data files for use during runs of the playground are store in $XDG_DATA_HOME/topos-playground, which defaults to $HOME/.local/share/topos-playground and log files are stored in $XDG_STATE_HOME/topos-playground/logs, which defaults to $HOME/.local/state/topos-playground/logs.

These locations can be overridden by setting the environment variables HOME, XDG_DATA_HOME, and XDG_STATE_HOME.
`.trim()

const columns = process.stdout.columns || 80

@RootCommand({
  description: `${breakText(description, columns)}\n\n${breakText(helptext, columns)}`,
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

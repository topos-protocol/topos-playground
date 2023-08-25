import { RootCommand, Option, CommandRunner } from 'nest-commander'

const { description, version } = require('../../package.json')
import { log } from '../loggers'
import { breakText } from '../utility'

const helptext = `

Configuration

topos-playground follows the XDG Base Directory Specification, which means that data files for use during runs of the playground are store in $XDG_DATA_HOME/topos-playground, which defaults to $HOME/.local/share/topos-playground and log files are stored in $XDG_STATE_HOME/topos-playground/logs, which defaults to $HOME/.local/state/topos-playground/logs.

These locations can be overridden by setting the environment variables HOME, XDG_DATA_HOME, and XDG_STATE_HOME.
`.trim()
const columns = process.stdout.columns || 80
const overrideQuiet = true

@RootCommand({
  description: `${breakText(description, columns)}\n\n${breakText(
    helptext,
    columns
  )}`,
})
export class Root extends CommandRunner {
  constructor() {
    super()
  }

  async run(): Promise<void> {}

  @Option({
    flags: '--version',
    description: `Show topos-playground version (v${version})`,
  })
  doVersion() {
    log(
      (globalThis.quiet ? '' : 'topos-playground version ') + version,
      overrideQuiet
    )
    log(``)
  }

  @Option({
    flags: '-v, --verbose',
    description: breakText(
      `Show more information about the execution of a command`,
      39
    ),
  })
  doVerbose() {
    globalThis.verbose = true
  }

  @Option({
    flags: '-q, --quiet',
    description: breakText(
      `Show minimal onscreen information about the execution of a command`,
      39
    ),
  })
  doQuiet() {
    globalThis.quiet = true
  }

  @Option({
    flags: '-n, --no-log',
    description: `Do not write a log file`,
  })
  doNoLog() {
    globalThis.noLog = true
  }
}

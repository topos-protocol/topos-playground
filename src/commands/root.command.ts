import * as chalk from 'chalk'
import { RootCommand, Option, CommandRunner } from 'nest-commander'

const { description, version } = require('../../package.json')
import { log } from '../loggers'
import { breakText } from '../utility'

const example = chalk.green

const helptext = `
Example Usage

  $ ${example('topos-playground start')}
    Start the Topos-Playground. This command will output the status of the playground creation to the terminal as it runs, and will log a more detailed status to a log file.

  $ ${example('topos-playground start --verbose')}
    This will also start the topos playground, but the terminal output as well as the log file output will contain more information. This is useful for debugging if there are errors starting the playground.

  $ ${example('topos-playground start -q')}
    This will start the topos playground quietly. Most output will be suppressed.

  $ ${example('topos-playground clean')}
    This will clean the topos playground. It will shut down all containers, and remove all filesystem artifacts except for log files.

  $ ${example('topos-playground version')}
    This will print the version of the topos playground.

  $ ${example('topos-playground version -q')}')
    This will print only the numbers of the topos-playground version, with no other output.
  
Configuration

  topos-playground follows the XDG Base Directory Specification, which means that data files for use during runs of the playground are stored in $XDG_DATA_HOME/topos-playground, which defaults to $HOME/.local/share/topos-playground and log files are stored in $XDG_STATE_HOME/topos-playground/logs, which defaults to $HOME/.local/state/topos-playground/logs.

  These locations can be overridden by setting the environment variables HOME, XDG_DATA_HOME, and XDG_STATE_HOME.
`
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
      columns - 18
    ),
  })
  doVerbose() {
    globalThis.verbose = true
  }

  @Option({
    flags: '-q, --quiet',
    description: breakText(
      `Show minimal onscreen information about the execution of a command`,
      columns - 18
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

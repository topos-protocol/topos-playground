import { Command, CommandRunner } from 'nest-commander'

const { version } = require('../../package.json')
import { log } from '../loggers'

const overrideQuiet = true

@Command({
  name: 'version',
  description: `Show topos-playground version (v${version})`,
})
export class VersionCommand extends CommandRunner {
  constructor() {
    super()
  }

  async run(): Promise<void> {
    log(
      (globalThis.quiet ? '' : 'topos-playground version ') + version,
      overrideQuiet
    )
    log(``)
  }
}

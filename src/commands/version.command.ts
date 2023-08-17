const { version } = require('../../package.json');

import { Command, CommandRunner } from 'nest-commander'

import { ReactiveSpawn } from '../ReactiveSpawn'
import { log } from 'src/loggers'

  
@Command({
  name: 'version',
  description: `Show topos-playground version (v${version})`,
})
  
export class VersionCommand extends CommandRunner {
  constructor(private _spawn: ReactiveSpawn) {
    super()
  }

  async run(): Promise<void> {
    log((globalThis.quiet ? '' : 'topos-playground version ') + version, true)
    log(``)
  }

}

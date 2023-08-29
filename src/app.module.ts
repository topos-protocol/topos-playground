import { Module } from '@nestjs/common'

import { CleanCommand } from './commands/clean.command'
import { StartCommand } from './commands/start.command'
import { VersionCommand } from './commands/version.command'
import { Root } from './commands/root.command'

import { ReactiveSpawn } from './ReactiveSpawn'

@Module({
  providers: [ReactiveSpawn, CleanCommand, StartCommand, VersionCommand, Root],
})
export class AppModule {}

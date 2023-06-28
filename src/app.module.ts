import { Module } from '@nestjs/common'

import { CleanCommand } from './commands/clean.command'
import { StartCommand } from './commands/start.command'
import { ReactiveSpawn } from './ReactiveSpawn'

@Module({
  providers: [ReactiveSpawn, CleanCommand, StartCommand],
})
export class AppModule {}

import { Module } from '@nestjs/common'

import { SecretQuestions } from './questions/secrets.questions'
import { CleanCommand } from './commands/clean.command'
import { StartCommand } from './commands/start.command'
import { ReactiveSpawn } from './ReactiveSpawn'

@Module({
  providers: [ReactiveSpawn, SecretQuestions, CleanCommand, StartCommand],
})
export class AppModule {}

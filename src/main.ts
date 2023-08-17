#!/usr/bin/env node
import { CommandFactory } from 'nest-commander'
import { setupGlobals } from 'src/globals'
import { AppModule } from './app.module'

async function bootstrap() {
  await CommandFactory.run(AppModule)
}

setupGlobals()
bootstrap()

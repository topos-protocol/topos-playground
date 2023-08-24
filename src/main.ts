#!/usr/bin/env node
import { CommandFactory } from 'nest-commander'

import { initializeGlobals, initializeDirectories } from './initializers'
import { AppModule } from './app.module'

async function bootstrap() {
  await CommandFactory.run(AppModule)
}

initializeGlobals()
initializeDirectories()
bootstrap()

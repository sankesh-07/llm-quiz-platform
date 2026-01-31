import dotenv from 'dotenv';

dotenv.config();

import { startApp } from './app';

startApp().catch((err) => {
  console.error('Failed to start application', err);
  process.exit(1);
});

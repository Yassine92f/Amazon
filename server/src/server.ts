import app from './app';
import { config } from './config';
import { connectDatabase } from './infrastructure/database/connection';

async function bootstrap() {
  await connectDatabase();

  app.listen(config.port, () => {
    console.log(`\n🚀 Server running on http://localhost:${config.port}`);
    console.log(`   Environment: ${config.env}`);
    console.log(`   API base:    http://localhost:${config.port}/api\n`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

import type { Server } from 'http';
import app from './app';
import { config, validateConfig } from './config';
import { connectDatabase, closeDatabase } from './infrastructure/database/connection';
import { closeRedis } from './infrastructure/cache/redis';
import { logger } from './infrastructure/logging/logger';

async function bootstrap() {
  validateConfig();
  await connectDatabase();

  const server: Server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.env },
      `Server running on http://localhost:${config.port}/api`,
    );
  });

  registerShutdownHandlers(server);
}

/**
 * Drain in-flight requests, then release external resources before exiting.
 * Triggered by SIGTERM (orchestrator stop) and SIGINT (Ctrl-C). A hard timeout
 * guarantees the process eventually dies even if a connection hangs.
 */
function registerShutdownHandlers(server: Server) {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down gracefully');

    const forceExit = setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    try {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
      await closeDatabase();
      await closeRedis();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception, shutting down');
    void shutdown('uncaughtException');
  });
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});

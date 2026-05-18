import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import routes from './interfaces/http/routes';
import { UPLOADS_DIR } from './interfaces/http/routes/uploads';
import { openapiSpec } from './interfaces/http/openapi';
import { errorHandler } from './interfaces/http/middlewares/errorHandler';
import { logger } from './infrastructure/logging/logger';
import { config } from './config';

const app: Express = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);

// Uploaded images, served with a relaxed CORP header so the client (different
// origin in dev) can load them.
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  }),
);

// Stripe webhook needs the untouched raw body to verify the signature, so it
// must be parsed as a Buffer BEFORE the global JSON parser runs.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Structured request logging (silent in test via the logger's level)
app.use(
  pinoHttp({
    logger,
    // Health checks are noisy and uninteresting; drop them to debug level.
    customLogLevel(_req, res, err) {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    autoLogging: {
      ignore: (req) => req.url === '/api/health' || req.url === '/health',
    },
  }),
);

// Liveness probe (used by Docker/orchestrator healthchecks)
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
});

// API documentation (Swagger UI + raw OpenAPI JSON)
app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));
app.use(
  '/api/docs',
  // helmet's default CSP blocks Swagger UI's inline assets; relax it for this path.
  helmet({ contentSecurityPolicy: false }),
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, { customSiteTitle: 'Abracadabra API — Docs' }),
);

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

export default app;

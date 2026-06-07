import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import routes from './interfaces/http/routes';
import { openapiSpec } from './interfaces/http/openapi';
import { errorHandler } from './interfaces/http/middlewares/errorHandler';
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

// Stripe webhook needs the untouched raw body to verify the signature, so it
// must be parsed as a Buffer BEFORE the global JSON parser runs.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

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

import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './interfaces/http/routes';
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

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

export default app;

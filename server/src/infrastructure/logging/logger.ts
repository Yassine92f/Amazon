import pino from 'pino';
import { config } from '../../config';

/**
 * Application-wide structured logger.
 *
 * - In development we pretty-print to a TTY for readability.
 * - In test we stay silent to keep the suite output clean.
 * - In production we emit newline-delimited JSON, which log shippers
 *   (Loki, CloudWatch, Datadog, ...) ingest natively.
 */
const isProd = config.env === 'production';
const isTest = config.env === 'test';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : isTest ? 'silent' : 'debug'),
  // Never log secrets even if an object containing them is passed to the logger.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'token',
      'refreshToken',
    ],
    censor: '[redacted]',
  },
  transport:
    !isProd && !isTest
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
      : undefined,
});

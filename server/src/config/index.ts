import dotenv from 'dotenv';
import path from 'path';

// .env lives at the monorepo root, three levels up from this file
// (server/src/config in dev, server/dist/config after build).
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5001', 10),

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@ecommerce.local',
    // 'smtp' to force the real SMTP transport in development; otherwise dev uses
    // Ethereal (preview links). Production always uses real SMTP.
    transport: process.env.EMAIL_TRANSPORT || '',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
} as const;

const DEFAULT_JWT_SECRET = 'default-secret';
const DEFAULT_JWT_REFRESH_SECRET = 'default-refresh-secret';

/**
 * Validate critical configuration before the server accepts traffic.
 *
 * In production we refuse to boot with insecure defaults or missing secrets so a
 * misconfigured deploy fails loudly instead of silently running with a known
 * signing key. In development the same problems are surfaced as warnings so the
 * local experience stays frictionless. Importing `config` never throws — only
 * calling this (from the boot path) does.
 */
export function validateConfig(): void {
  const isProd = config.env === 'production';
  const problems: string[] = [];

  if (config.jwt.secret === DEFAULT_JWT_SECRET) {
    problems.push('JWT_SECRET is using the insecure default value');
  }
  if (config.jwt.refreshSecret === DEFAULT_JWT_REFRESH_SECRET) {
    problems.push('JWT_REFRESH_SECRET is using the insecure default value');
  }
  if (config.jwt.secret === config.jwt.refreshSecret) {
    problems.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }
  if (isProd && config.jwt.secret.length < 32) {
    problems.push('JWT_SECRET should be at least 32 characters in production');
  }
  if (isProd && !config.stripe.secretKey) {
    problems.push('STRIPE_SECRET_KEY is required in production');
  }
  if (isProd && !process.env.MONGODB_URI) {
    problems.push('MONGODB_URI must be set explicitly in production');
  }

  if (problems.length === 0) return;

  const message = `Configuration problems detected:\n  - ${problems.join('\n  - ')}`;
  if (isProd) {
    throw new Error(message);
  }
  // eslint-disable-next-line no-console
  console.warn(
    `⚠ ${message}\n  (allowed in ${config.env}, but would abort the boot in production)`,
  );
}

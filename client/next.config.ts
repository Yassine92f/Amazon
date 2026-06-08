import type { NextConfig } from 'next';
import { config as loadEnv } from 'dotenv';
import path from 'path';

// The monorepo keeps a single .env at the repository root. Next only auto-loads
// .env files from this package dir, so load the root one here to expose the
// NEXT_PUBLIC_* vars (API URL, WS URL, Stripe publishable key) to the build.
// `next dev`/`next build` run with the cwd set to this package, so ../.env is the root.
loadEnv({ path: path.resolve(process.cwd(), '../.env') });

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) so the production
  // image ships only the traced runtime files instead of the whole monorepo +
  // pnpm. `outputFileTracingRoot` points at the repo root so the workspace
  // dependency (@ecommerce/shared) is traced and bundled correctly.
  output: 'standalone',
  outputFileTracingRoot: path.resolve(process.cwd(), '..'),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      // Locally-uploaded images are served by the API over http in dev.
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
};

export default nextConfig;

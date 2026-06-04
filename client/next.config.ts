import type { NextConfig } from 'next';
import { config as loadEnv } from 'dotenv';
import path from 'path';

// The monorepo keeps a single .env at the repository root. Next only auto-loads
// .env files from this package dir, so load the root one here to expose the
// NEXT_PUBLIC_* vars (API URL, WS URL, Stripe publishable key) to the build.
// `next dev`/`next build` run with the cwd set to this package, so ../.env is the root.
loadEnv({ path: path.resolve(process.cwd(), '../.env') });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

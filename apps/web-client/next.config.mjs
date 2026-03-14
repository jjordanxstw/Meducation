import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadSimpleEnvFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const appEnv = process.env.APP_ENV?.trim();
if (appEnv) {
  const customEnvPath = resolve(process.cwd(), `.env.${appEnv}`);
  if (existsSync(customEnvPath)) {
    loadSimpleEnvFile(customEnvPath);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '**.drive.google.com' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['@nextui-org/react', 'react-icons', '@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction'],
  },
  // Proxy API requests to NestJS backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
  devIndicators:false,
};

export default nextConfig;

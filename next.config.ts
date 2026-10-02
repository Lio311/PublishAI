import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { getSecurityHeadersArray } from './src/services/security/headers';

const withNextIntl = createNextIntlPlugin('./src/app/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost', '::1'],
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx', 'docx', 'sharp', 'pg'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      '@tiptap/react',
      'sonner',
      '@neondatabase/serverless',
    ],
  },
  // The Content-Security-Policy is set only by src/proxy.ts: sending it from here as well
  // produced two CSP headers, which browsers enforce together. The remaining security
  // headers come from the same source and also cover static files the proxy skips.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: getSecurityHeadersArray().filter((h) => h.key !== 'Content-Security-Policy'),
      },
    ];
  },
};

export default withNextIntl(nextConfig);

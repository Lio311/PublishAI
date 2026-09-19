import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/app/i18n/request.ts');

const nextConfig: NextConfig = {
  // your existing config
  // @ts-ignore
  allowedDevOrigins: ['127.0.0.1', 'localhost', '::1'],
};

export default withNextIntl(nextConfig);

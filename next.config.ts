import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const connectSrc =
  process.env.NODE_ENV === 'development'
    ? "connect-src 'self' http://localhost:8000 ws://localhost:8000 http://localhost:4566 http://127.0.0.1:4566 https: ws: wss:"
    : "connect-src 'self' https: wss:";

const imgSrc =
  process.env.NODE_ENV === 'development'
    ? "img-src 'self' data: blob: https: http://localhost:4566 http://localhost:3000"
    : "img-src 'self' data: blob: https:";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry.io https://browser.sentry-cdn.com https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://translate.googleapis.com https://www.gstatic.com",
  imgSrc,
  "font-src 'self' data: https://fonts.gstatic.com",
  connectSrc,
  "media-src 'self' blob:",
  "object-src 'none'",
  "frame-src 'self' https://translate.google.com https://translate.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: csp,
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), fullscreen=(self), autoplay=(self)',
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@react-pdf/renderer'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lawvriksh-documents.s3.us-east-1.amazonaws.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default bundleAnalyzer(
  withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG || 'example-org',
    project: process.env.SENTRY_PROJECT || 'example-project',
    silent: !process.env.CI,
    widenClientFileUpload: true,
    reactComponentAnnotation: {
      enabled: true,
    },
    tunnelRoute: '/monitoring',
    disableLogger: true,
    automaticVercelMonitors: true,
  })
);

const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    // Disable ESLint during builds (production builds should be fast)
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer, dev }) => {
    // Disable canvas for PDF.js
    config.resolve.alias.canvas = false;

    // Completely ignore PDF.js on server side
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdfjs-dist': false,
      };
      return config;
    }

    // Add rule to handle .mjs files from pdfjs-dist
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules\/pdfjs-dist/,
      type: 'javascript/auto',
    });

    // Workbox configuration for Service Worker
    if (!dev && !isServer) {
      config.plugins.push(
        new (require('workbox-webpack-plugin').InjectManifest)({
          swSrc: './public/sw.ts',
          swDest: '../public/sw.js',
          exclude: [
            /\.map$/,
            /manifest\.json$/,
            /_next\/static\/.*\/js\/\[\[.*\]\].*\.js$/,
            /_next\/static\/webpack\/.*\.hot-update\./,
          ],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        })
      );
    }

    return config;
  },
  // Headers for PWA
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/icons/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/splash/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Rewrites for offline support
  async rewrites() {
    return [
      {
        source: '/offline.html',
        destination: '/offline',
      },
    ];
  },
  // Redirects
  async redirects() {
    return [];
  },
};

module.exports = withNextIntl(nextConfig);

/** @type {import('next').NextConfig} */
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'
const isTurbopack = process.env.TURBOPACK === '1' || process.argv.includes('--turbo')

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: true,
  // Performance optimizations
  swcMinify: true,
  // Production optimizations
  // Note: compiler.removeConsole is not supported by Turbopack
  ...(!isTurbopack && {
    compiler: {
      removeConsole: !isDev ? {
        exclude: ['error', 'warn'], // Keep errors and warnings
      } : false,
    },
  }),
  // Optimize bundle size
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@tanstack/react-query',
      'axios',
      'zod',
      'react-hook-form',
      'react-icons',
      'leaflet',
    ],
    // Enable CSS optimization in production
    optimizeCss: !isDev,
    // Turbopack optimizations - simplified for faster startup
    turbo: {
      // Minimal rules for faster startup
      resolveAlias: {
        // Add any aliases if needed
      },
    },
    // Enable server components optimization
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Faster development - more aggressive caching
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: isDev ? 60 * 1000 : 60 * 1000, // Longer cache (60s) for better dev experience
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: isDev ? 5 : 5, // Keep more pages (5) to prevent frequent recompilation
  },
  // Production optimizations
  ...(!isDev && {
    reactStrictMode: true, // Enable in production for better error detection
    poweredByHeader: false, // Remove X-Powered-By header
    compress: true, // Enable gzip compression
  }),
  // Faster compilation in development
  ...(isDev && {
    reactStrictMode: false, // Disable strict mode in dev for faster compilation
    // Disable source maps in dev for MUCH faster compilation
    productionBrowserSourceMaps: false,
  }),
  // Webpack optimizations for faster compilation
  // Note: This only applies when NOT using Turbopack (--turbo flag)
  webpack: (config, { isServer, dev }) => {
    // Faster compilation in development
    if (dev) {
      // Disable source maps completely for MUCH faster compilation
      config.devtool = false;

      // Faster watch options
      config.watchOptions = {
        poll: false, // Disable polling for faster performance
        aggregateTimeout: 100, // Even faster aggregation (was 200)
        ignored: ['**/node_modules', '**/.git', '**/.next', '**/.turbo'],
      };

      // Aggressive caching for faster rebuilds - use absolute path
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve(__dirname, '.next/cache/webpack'),
        compression: 'gzip',
        // More aggressive cache settings
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      };

      // Reduce module resolution overhead
      config.resolve.symlinks = false;
      // Faster module resolution
      config.resolve.cache = true;

      // Disable unnecessary optimizations in dev
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false, // Disable code splitting in dev for faster compilation
      };
    }

    if (!isServer) {
      // Optimize client-side bundle
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for large libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Separate chunk for large libraries
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
            leaflet: {
              name: 'leaflet',
              test: /[\\/]node_modules[\\/]leaflet[\\/]/,
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
            pdf: {
              name: 'pdf',
              test: /[\\/]node_modules[\\/](html2canvas|jspdf)[\\/]/,
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Radix UI components
            radix: {
              name: 'radix',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              chunks: 'all',
              priority: 25,
              reuseExistingChunk: true,
            },
          },
        },
        // Production optimizations
        ...(!dev && {
          moduleIds: 'deterministic',
          runtimeChunk: 'single',
        }),
      };
    }

    // Exclude Prisma from client bundle (if used incorrectly)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://app.sandbox.midtrans.com https://app.midtrans.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://app.sandbox.midtrans.com https://app.midtrans.com; object-src 'none';",
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
    // Optimize images - disable in dev for faster compilation
    formats: isDev ? ['image/webp'] : ['image/avif', 'image/webp'],
    deviceSizes: isDev ? [640, 1080, 1920] : [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: isDev ? [16, 32, 64, 128] : [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: isDev ? 0 : 31536000, // 1 year cache in production
    // Disable image optimization in dev for faster compilation
    unoptimized: isDev,
    // Production image optimization
    ...(!isDev && {
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    }),
  },
  env: {
    // Use localhost for local development, Railway for production
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },
  async rewrites() {
    // Use localhost for local development, Railway for production
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const fileUrl = apiUrl.replace('/api', '');

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${fileUrl}/uploads/:path*`,
      },
      {
        source: '/galery/:path*',
        destination: `/galery/:path*`,
      },
    ]
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  
  // Disable telemetry
  experimental: {
    instrumentationHook: false,
  },

  // Environment variables for build
  env: {
    SKIP_DB_CONNECTION: 'true',
    NODE_ENV: 'production',
  },

  // Disable API routes during build
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // Redirect root to warehouse-v2
  async redirects() {
    return [
      {
        source: '/',
        destination: '/warehouse-v2',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

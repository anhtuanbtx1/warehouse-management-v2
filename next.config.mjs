/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,

  // Disable telemetry to avoid trace file issues
  experimental: {
    instrumentationHook: false,
  },

  // Environment variables for build
  env: {
    NEXT_PHASE: process.env.NEXT_PHASE || 'phase-development-server',
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

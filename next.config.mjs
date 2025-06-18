/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Redirect root to warehouse-v2
  async redirects() {
    return [
      {
        source: '/',
        destination: '/warehouse-v2',
        permanent: false, // Use 307 temporary redirect
      },
    ];
  },
};

export default nextConfig;

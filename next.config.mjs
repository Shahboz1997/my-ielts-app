import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Исправление ошибки "Call retries were exceeded"
    workerThreads: false, 
    cpus: 1,
    
    // Исправление ошибки Turbopack
    turbopack: {}, 
    
    serverActions: {
      allowedOrigins: ["10.165.239.173", "10.187.95.173", "localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default withPWA(nextConfig);

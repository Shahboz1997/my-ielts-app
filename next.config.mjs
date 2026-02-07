import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
     allowedDevOrigins: ['10.187.95.173'],
    // Удалите старый allowedDevOrigins отсюда
    serverActions: {
      allowedOrigins: ["10.165.239.173", "localhost:3000"],
    },
  },
  // Если вы используете изображения (например, аватарки или загрузку графиков)
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

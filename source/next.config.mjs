/** @type {import('next').NextConfig} */
export default {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 828, 1080, 1440, 1920],
    // Only needed when CATALOG_PROVIDER=catlog (images served straight from the client's Catlog S3)
    remotePatterns: [
      { protocol: 'https', hostname: 'catlog-s3.s3.eu-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 'catlog-1.s3.eu-west-2.amazonaws.com' },
    ],
  },
  experimental: { optimizePackageImports: ['framer-motion'] },
};

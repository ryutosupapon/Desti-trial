/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Allow remote S3 bucket for migrated large assets
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'desti-images.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    return config
  },
}

module.exports = nextConfig

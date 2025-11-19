/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Remove query param warnings by explicitly allowing hero and root assets
    // (Better: stop using version query strings like ?v=1 entirely.)
    // Next 15 still serves these without config; we future-proof for 16.
    formats: ['image/avif', 'image/webp'],
  },
  // Keep webpack persistent caching enabled for faster dev rebuilds
  webpack: (config) => {
    return config
  },
}

module.exports = nextConfig

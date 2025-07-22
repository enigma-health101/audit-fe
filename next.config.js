// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Remove the experimental.appDir as it's deprecated in newer Next.js versions
  // If you're using Pages Router, you don't need this
  // If you're using App Router, remove this entire experimental section

  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        // Fixed: removed space in "http: //localhost:5007"
        destination: 'http://localhost:5007/api/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          },
        ]
      }
    ]
  }
}

module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Allow our iframe streaming providers + trailer embeds.
            value:
              "frame-src 'self' https://www.vidking.net https://vidsrc.to https://embed.su https://www.youtube-nocookie.com https://www.youtube.com; object-src 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

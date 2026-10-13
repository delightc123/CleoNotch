/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: "/privacy", destination: "/privacy.html" },
      { source: "/terms", destination: "/terms.html" },
      { source: "/legal", destination: "/legal.html" },
      { source: "/support", destination: "/support.html" },
      { source: "/iphone", destination: "/iphone.html" },
    ];
  },
};

export default nextConfig;

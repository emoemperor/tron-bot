/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["grammy", "telegram-markdown-sanitizer"],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Suprimir avisos de params no React DevTools
  reactStrictMode: true,
  // Configuração para evitar problemas com serialização de props
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig

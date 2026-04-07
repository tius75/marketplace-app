import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Ini penting agar gambar bisa muncul saat diakses via IP Address di HP
    unoptimized: true, 
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
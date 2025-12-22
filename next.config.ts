import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        port: "",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "fotogifty.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/fotos/**",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;

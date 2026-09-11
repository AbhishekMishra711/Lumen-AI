import type { NextConfig } from "next";

const nextConfig: NextConfig & { serverActions?: any } = {
  reactCompiler: true,
};

export default nextConfig;

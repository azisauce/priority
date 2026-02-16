import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["knex", "pg", "pg-native"],
};

export default nextConfig;

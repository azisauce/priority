import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  serverExternalPackages: ["knex", "pg", "pg-native"],
  turbopack: {},
};

const isDev = process.env.NODE_ENV === "development";

export default isDev
  ? nextConfig
  : withPWA({
      dest: "public",
      register: true,
      skipWaiting: true,
      workboxOptions: {
        runtimeCaching: [],
      },
    })(nextConfig);
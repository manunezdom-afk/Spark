import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.pathname.startsWith("/api/sessions/") &&
          (url.pathname.endsWith("/message") || url.pathname.endsWith("/complete")),
        handler: "NetworkOnly",
      },
      {
        urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"),
        handler: "NetworkFirst",
        options: {
          cacheName: "spark-api",
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default withPWA(nextConfig);

import type { NextConfig } from "next";
const nextConfig: NextConfig = { reactStrictMode: true, distDir: process.env.FOLIO_BUILD_DIR || ".next" };
export default nextConfig;

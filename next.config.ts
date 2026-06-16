import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Set BASE_PATH env var in CI to /repo-name for GitHub Pages subdirectory deploys.
  // Leave unset for local dev or a root-domain deploy.
  basePath: process.env.BASE_PATH ?? "",
};

export default nextConfig;

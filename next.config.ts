import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the repo AGENTS.md (lakehouse-style contract). Do not let Next overwrite it.
  agentRules: false,
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the repo AGENTS.md (lakehouse-style contract). Do not let Next overwrite it.
  agentRules: false,
  // Dev HMR websocket is blocked if the tab is 127.0.0.1 and Next bound localhost.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  outputFileTracingIncludes: {
    "/": ["./data/gold/**/*"],
    "/spikes": ["./data/gold/**/*"],
    "/mix": ["./data/gold/**/*"],
  },
};

export default nextConfig;

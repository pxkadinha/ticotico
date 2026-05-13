import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // web-push uses Node.js built-ins (crypto, http, etc.) that cannot be
  // bundled by webpack — tell Next.js to require() it at runtime instead.
  serverExternalPackages: ["web-push"],
};

export default nextConfig;

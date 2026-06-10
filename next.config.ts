import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Better Auth pulls optional adapters (kysely sqlite dialect) it doesn't use
  // with the Drizzle adapter. Keep them server-external so the bundler doesn't
  // statically resolve a mismatched kysely export.
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter"],
  // Don't serve dynamic pages from the client Router Cache: a mutation in one
  // module must be reflected when navigating to another (no manual reload).
  allowedDevOrigins: ["67.73.237.30" , "accounting-360.local"],
  experimental: {
    staleTimes: { dynamic: 30, static: 30 },
  },
};

export default nextConfig;

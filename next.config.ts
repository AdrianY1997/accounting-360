import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Better Auth pulls optional adapters (kysely sqlite dialect) it doesn't use
  // with the Drizzle adapter. Keep them server-external so the bundler doesn't
  // statically resolve a mismatched kysely export.
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter"],
  // Don't serve dynamic pages from the client Router Cache: a mutation in one
  // module must be reflected when navigating to another (no manual reload).
  experimental: {
    staleTimes: { dynamic: 0, static: 0 },
  },
};

export default nextConfig;

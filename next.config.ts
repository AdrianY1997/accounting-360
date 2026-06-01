import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Better Auth pulls optional adapters (kysely sqlite dialect) it doesn't use
  // with the Drizzle adapter. Keep them server-external so the bundler doesn't
  // statically resolve a mismatched kysely export.
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter"],
};

export default nextConfig;

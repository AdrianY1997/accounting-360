// Barrel for all Drizzle schema. Keep one file per concern; re-export here so
// `import * as schema from "@/db/schema"` stays the single source.
export * from "./auth";
export * from "./salon";
export * from "./client";
export * from "./catalog";
export * from "./sale";
export * from "./payment";
export * from "./cash";
export * from "./expense";
export * from "./commission";
export * from "./access";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getResellerLink } from "@/services/clients";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

const inputSchema = z.object({
  clientId: z.string().trim().min(1),
  showPrices: z.boolean().default(false),
  rotate: z.boolean().optional(),
});

/** Gets (or creates/rotates) a reseller's catalog link for the given price mode. */
export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "catalog:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const parsed = inputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const link = await getResellerLink(
    ctx,
    parsed.data.clientId,
    parsed.data.showPrices,
    parsed.data.rotate ?? false,
  );
  if (!link) {
    return NextResponse.json(
      { error: "El cliente no es un intermediario activo de este salón" },
      { status: 400 },
    );
  }
  return NextResponse.json({ token: link.id });
}

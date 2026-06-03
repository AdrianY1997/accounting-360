import { NextResponse } from "next/server";
import { createService, listServices } from "@/services/catalog";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { serviceInputSchema } from "@/lib/validations/catalog";

export async function GET() {
  const ctx = await requireSalonContext();
  return NextResponse.json(await listServices(ctx));
}

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  if (!can(ctx.role, "catalog:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const parsed = serviceInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  return NextResponse.json(await createService(ctx, parsed.data), {
    status: 201,
  });
}

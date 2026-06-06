import { NextResponse } from "next/server";
import { createSalon, listSalons } from "@/services/salons";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { createSalonSchema } from "@/lib/validations/salon";

export async function GET() {
  const ctx = await requireSalonContext();
  return NextResponse.json(await listSalons(ctx));
}

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "salon:manage")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const parsed = createSalonSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  return NextResponse.json(await createSalon(ctx, parsed.data), { status: 201 });
}

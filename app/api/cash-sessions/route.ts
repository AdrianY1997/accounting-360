import { NextResponse } from "next/server";
import { listSessions, openSession } from "@/services/cash";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { openSessionSchema } from "@/lib/validations/cash";

export async function GET() {
  const ctx = await requireSalonContext();
  return NextResponse.json(await listSessions(ctx));
}

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "cash:manage")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const parsed = openSessionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const created = await openSession(ctx, parsed.data);
  if (!created) {
    return NextResponse.json(
      { error: "Ya hay una caja abierta" },
      { status: 409 },
    );
  }
  return NextResponse.json(created, { status: 201 });
}

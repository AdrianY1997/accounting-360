import { NextResponse } from "next/server";
import { createStaff, listStaff } from "@/services/staff";
import { isAdmin } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { createStaffSchema } from "@/lib/validations/staff";

export async function GET() {
  const ctx = await requireSalonContext();
  if (!isAdmin(ctx.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return NextResponse.json(await listStaff(ctx));
}

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  if (!isAdmin(ctx.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const parsed = createStaffSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const created = await createStaff(ctx, parsed.data);
  if (!created) {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese correo" },
      { status: 409 },
    );
  }
  return NextResponse.json(created, { status: 201 });
}

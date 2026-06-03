import { NextResponse } from "next/server";
import { removeStaff, updateStaff } from "@/services/staff";
import { isAdmin } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { updateStaffSchema } from "@/lib/validations/staff";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!isAdmin(salon.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const parsed = updateStaffSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const updated = await updateStaff(salon, id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Staff no encontrado" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!isAdmin(salon.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const res = await removeStaff(salon, id);
  if (!res.ok) {
    const map: Record<string, [string, number]> = {
      not_found: ["Staff no encontrado", 404],
      self: ["No puedes eliminarte a ti mismo", 400],
      owner: ["No se puede eliminar al dueño", 400],
    };
    const [msg, status] = map[res.reason] ?? ["Error", 400];
    return NextResponse.json({ error: msg }, { status });
  }
  return NextResponse.json({ ok: true });
}

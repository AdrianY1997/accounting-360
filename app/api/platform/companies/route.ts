import { NextResponse } from "next/server";
import {
  createCompany,
  getPlatformSession,
  listAllOrganizations,
} from "@/services/platform";
import { createCompanySchema } from "@/lib/validations/platform";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return NextResponse.json(await listAllOrganizations());
}

export async function POST(req: Request) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const parsed = createCompanySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const created = await createCompany(parsed.data);
  if (!created) {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese correo" },
      { status: 409 },
    );
  }
  return NextResponse.json(created, { status: 201 });
}

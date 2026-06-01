import { NextResponse } from "next/server";
import { createClient, listClients } from "@/services/clients";
import { requireSalonContext } from "@/lib/tenant";
import { clientInputSchema } from "@/lib/validations/client";

export async function GET() {
  const ctx = await requireSalonContext();
  const clients = await listClients(ctx);
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  const parsed = clientInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const created = await createClient(ctx, parsed.data);
  return NextResponse.json(created, { status: 201 });
}

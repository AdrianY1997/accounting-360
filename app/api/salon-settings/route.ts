import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/services/settings";
import { requireSalonContext } from "@/lib/tenant";
import { salonSettingsSchema } from "@/lib/validations/settings";

export async function GET() {
  const ctx = await requireSalonContext();
  return NextResponse.json(await getSettings(ctx));
}

export async function PUT(req: Request) {
  const ctx = await requireSalonContext();
  const parsed = salonSettingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  return NextResponse.json(await updateSettings(ctx, parsed.data));
}

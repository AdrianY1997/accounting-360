import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { requireSession } from "@/lib/session";

/** Marks the current user's first-run tour as completed. */
export async function POST() {
  const session = await requireSession();
  await db
    .update(user)
    .set({ onboarded: true })
    .where(eq(user.id, session.user.id));
  return NextResponse.json({ ok: true });
}

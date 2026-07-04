import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized } from "@/lib/auth";
import { setOwnPassword } from "@/lib/db";

export const dynamic = "force-dynamic";

/** A signed-in person sets their own login password. */
export async function POST(req: NextRequest) {
  const session = sessionOf(req);
  if (!session) return unauthorized();
  const body = await req.json();
  const password = typeof body?.password === "string" ? body.password.trim() : "";
  if (password.length < 4) {
    return NextResponse.json(
      { error: "Password must be at least 4 characters." },
      { status: 400 }
    );
  }
  const ok = setOwnPassword(session.email, password);
  if (!ok) {
    return NextResponse.json(
      { error: "No person with your email exists in People yet." },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized } from "@/lib/auth";
import { getDecision, logEvent } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED = ["pdf_exported", "evidence_generated"] as const;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!sessionOf(req)) return unauthorized();
  const body = await req.json();
  if (!ALLOWED.includes(body?.type)) {
    return NextResponse.json({ error: "Invalid event type." }, { status: 400 });
  }
  if (!getDecision(params.id)) {
    return NextResponse.json({ error: "Decision not found." }, { status: 404 });
  }
  logEvent(params.id, body.type, "Folor Admin", body.detail ?? "");
  return NextResponse.json({ ok: true });
}

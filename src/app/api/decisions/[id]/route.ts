import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized, forbidden } from "@/lib/auth";
import { getDecision, updateDecision, deleteDecision } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!sessionOf(_req)) return unauthorized();
  const decision = getDecision(params.id);
  if (!decision) return NextResponse.json({ error: "Decision not found." }, { status: 404 });
  return NextResponse.json({ decision });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!sessionOf(req)) return unauthorized();
  if (!sessionOf(req)!.isAdmin) return forbidden();
  const body = await req.json();
  const decision = updateDecision(params.id, body);
  if (!decision) return NextResponse.json({ error: "Decision not found." }, { status: 404 });
  return NextResponse.json({ decision });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!sessionOf(req)) return unauthorized();
  if (!sessionOf(req)!.isAdmin) return forbidden();
  const ok = deleteDecision(params.id);
  if (!ok) return NextResponse.json({ error: "Decision not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

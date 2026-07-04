import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized, forbidden } from "@/lib/auth";
import { deleteTeam, updateTeam } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!sessionOf(_req)) return unauthorized();
  if (!sessionOf(_req)!.isAdmin) return forbidden();
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid team id." }, { status: 400 });
  deleteTeam(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!sessionOf(req)) return unauthorized();
  if (!sessionOf(req)!.isAdmin) return forbidden();
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid team id." }, { status: 400 });
  const body = await req.json();
  const team = updateTeam(id, body);
  if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });
  return NextResponse.json({ team });
}

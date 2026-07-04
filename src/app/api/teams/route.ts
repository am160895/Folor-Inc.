import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized, forbidden } from "@/lib/auth";
import { createTeam, listTeams } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!sessionOf(req)) return unauthorized();
  return NextResponse.json({ teams: listTeams() });
}

export async function POST(req: NextRequest) {
  if (!sessionOf(req)) return unauthorized();
  if (!sessionOf(req)!.isAdmin) return forbidden();
  const body = await req.json();
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Team name is required." }, { status: 400 });
  }
  const team = createTeam(body.name, Array.isArray(body.memberIds) ? body.memberIds : []);
  return NextResponse.json({ team }, { status: 201 });
}

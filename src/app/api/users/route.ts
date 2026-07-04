import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized, forbidden } from "@/lib/auth";
import { createUser, listUsers } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!sessionOf(req)) return unauthorized();
  return NextResponse.json({ users: listUsers() });
}

export async function POST(req: NextRequest) {
  if (!sessionOf(req)) return unauthorized();
  if (!sessionOf(req)!.isAdmin) return forbidden();
  const body = await req.json();
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  const user = createUser({
    name: body.name,
    role: body.role ?? "Team member",
    email: body.email,
    phone: body.phone,
    notifyEmail: body.notifyEmail,
    notifySms: body.notifySms,
    teamId: typeof body.teamId === "number" ? body.teamId : null,
    password: body.password,
  });
  return NextResponse.json({ user }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized, forbidden } from "@/lib/auth";
import { createUser, listUsers, listTeams, getSettings } from "@/lib/db";
import { sendInvite } from "@/lib/notify";

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
  // Welcome email: tell the new person where to sign in and with what.
  let inviteStatus: "sent" | "demo" | "failed" | null = null;
  if (user.email) {
    const team =
      typeof body.teamId === "number"
        ? listTeams().find((t) => t.id === body.teamId) ?? null
        : null;
    inviteStatus = await sendInvite({
      toName: user.name,
      toEmail: user.email,
      workspaceName: getSettings().workspaceName,
      teamName: team?.name ?? null,
      password: user.password ?? team?.password ?? null,
      requestOrigin: new URL(req.url).origin,
    });
  }
  return NextResponse.json({ user, inviteStatus }, { status: 201 });
}

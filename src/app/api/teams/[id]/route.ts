import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized, forbidden } from "@/lib/auth";
import { deleteTeam, updateTeam, listTeams, listUsers, getSettings } from "@/lib/db";
import { sendInvite } from "@/lib/notify";

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
  const before = listTeams().find((t) => t.id === id);
  const team = updateTeam(id, body);
  if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });
  // Welcome email to anyone newly added to this team.
  if (before && Array.isArray(body.memberIds)) {
    const addedIds = team.memberIds.filter((mid) => !before.memberIds.includes(mid));
    if (addedIds.length) {
      const users = listUsers();
      const workspaceName = getSettings().workspaceName;
      for (const mid of addedIds) {
        const u = users.find((x) => x.id === mid);
        if (!u?.email) continue;
        await sendInvite({
          toName: u.name,
          toEmail: u.email,
          workspaceName,
          teamName: team.name,
          password: u.password ?? team.password,
          requestOrigin: new URL(req.url).origin,
        });
      }
    }
  }
  return NextResponse.json({ team });
}

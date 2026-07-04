import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized } from "@/lib/auth";
import { listDecisions, listUsers, listProjects, listTeams, getSettings } from "@/lib/db";
import { emailConfigured, smsConfigured } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = sessionOf(req);
  if (!session) return unauthorized();
  return NextResponse.json({
    me: { name: session.name, email: session.email, isAdmin: session.isAdmin },
    decisions: listDecisions(),
    users: listUsers(),
    projects: listProjects(),
    teams: listTeams(),
    settings: getSettings(),
    config: {
      emailConfigured: emailConfigured(),
      smsConfigured: smsConfigured(),
    },
  });
}

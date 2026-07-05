import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized } from "@/lib/auth";
import { listDecisions, listUsers, listProjects, listTeams, getSettings } from "@/lib/db";
import { emailConfigured, smsConfigured, emailSender } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = sessionOf(req);
  if (!session) return unauthorized();
  // Passwords only travel to admin sessions.
  const users = listUsers().map((u) => (session.isAdmin ? u : { ...u, password: null }));
  const teams = listTeams().map((t) => (session.isAdmin ? t : { ...t, password: null }));
  const settings = getSettings();
  return NextResponse.json({
    me: { name: session.name, email: session.email, isAdmin: session.isAdmin },
    decisions: listDecisions(),
    users,
    projects: listProjects(),
    teams,
    settings: session.isAdmin ? settings : { ...settings, adminPassword: "" },
    config: {
      emailConfigured: emailConfigured(),
      smsConfigured: smsConfigured(),
      emailSender: emailSender(),
      billingLink: process.env.STRIPE_PAYMENT_LINK || null,
    },
  });
}

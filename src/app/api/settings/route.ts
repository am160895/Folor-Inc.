import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized, forbidden } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!sessionOf(req)) return unauthorized();
  return NextResponse.json({ settings: getSettings() });
}

export async function POST(req: NextRequest) {
  if (!sessionOf(req)) return unauthorized();
  if (!sessionOf(req)!.isAdmin) return forbidden();
  const body = await req.json();
  const settings = updateSettings({
    adminPassword:
      typeof body.adminPassword === "string" && body.adminPassword.trim().length >= 4
        ? body.adminPassword.trim()
        : undefined,
    workspaceName: typeof body.workspaceName === "string" ? body.workspaceName.trim() || "Folor Inc." : undefined,
    currency: typeof body.currency === "string" ? body.currency : undefined,
    autoTeam: typeof body.autoTeam === "boolean" ? body.autoTeam : undefined,
    requireReason: typeof body.requireReason === "boolean" ? body.requireReason : undefined,
    defaultVisibility: body.defaultVisibility === "team" || body.defaultVisibility === "none" ? body.defaultVisibility : undefined,
    plan: body.plan === "trial" || body.plan === "pro" ? body.plan : undefined,
  });
  return NextResponse.json({ settings });
}

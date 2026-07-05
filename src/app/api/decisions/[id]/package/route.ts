import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized } from "@/lib/auth";
import { getDecision, packageHash, getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!sessionOf(_req)) return unauthorized();
  const decision = getDecision(params.id);
  if (!decision) return NextResponse.json({ error: "Decision not found." }, { status: 404 });
  return NextResponse.json({
    decision,
    hash: packageHash(params.id),
    workspace: getSettings().workspaceName,
    plan: getSettings().plan,
    generatedAt: new Date().toISOString(),
  });
}

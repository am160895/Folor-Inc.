import { NextRequest, NextResponse } from "next/server";
import { createDecision, getDecision, listDecisions, listUsers } from "@/lib/db";
import { notifyApprovers, notifyWatchers } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ decisions: listDecisions() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body?.title?.trim() || !body?.summary?.trim()) {
    return NextResponse.json({ error: "Title and decision are required." }, { status: 400 });
  }

  const decision = createDecision({
    title: body.title,
    summary: body.summary,
    reason: body.reason ?? "",
    location: body.location ?? "",
    projectId: body.projectId ?? null,
    newProjectName: body.newProjectName,
    costImpact: body.costImpact || null,
    scheduleImpact: body.scheduleImpact || null,
    watcherIds: Array.isArray(body.watcherIds) ? body.watcherIds : [],
    approverIds: Array.isArray(body.approverIds) ? body.approverIds : [],
    causedById: body.causedById || null,
    evidence: Array.isArray(body.evidence) ? body.evidence : [],
    recordedBy: "Folor Admin",
  });

  const users = listUsers();
  const approvers = decision.approvals
    .map((a) => ({ user: users.find((u) => u.id === a.userId)!, token: a.token }))
    .filter((a) => a.user);
  const watcherUsers = decision.watchers
    .map((w) => users.find((u) => u.id === w.id))
    .filter((u): u is NonNullable<typeof u> => !!u);

  const origin = new URL(req.url).origin;
  await notifyApprovers(decision, approvers, origin);
  await notifyWatchers(decision, watcherUsers);

  return NextResponse.json({ decision: getDecision(decision.id) }, { status: 201 });
}

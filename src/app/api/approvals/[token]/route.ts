import { NextRequest, NextResponse } from "next/server";
import { getApprovalByToken, respondToApproval } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const found = getApprovalByToken(params.token);
  if (!found) {
    return NextResponse.json({ error: "This approval link is not valid." }, { status: 404 });
  }
  const { decision } = found;
  return NextResponse.json({
    approverName: found.approverName,
    approverRole: found.approverRole,
    status: found.status,
    decision: {
      id: decision.id,
      title: decision.title,
      summary: decision.summary,
      reason: decision.reason,
      location: decision.location,
      projectName: decision.projectName,
      recordedBy: decision.recordedBy,
      dateLabel: decision.dateLabel,
      timeLabel: decision.timeLabel,
      costImpact: decision.costImpact,
      scheduleImpact: decision.scheduleImpact,
      people: decision.people.map((p) => ({ name: p.name, role: p.role })),
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const body = await req.json();
  const action = body?.action;
  if (action !== "approved" && action !== "declined") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  const updated = respondToApproval(params.token, action);
  if (!updated) {
    return NextResponse.json({ error: "This approval link is not valid." }, { status: 404 });
  }
  return NextResponse.json({ status: updated.status });
}

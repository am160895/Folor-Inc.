import { NextRequest, NextResponse } from "next/server";
import { getApprovalByToken, respondToApproval, markApprovalViewed, CONSENT_TEXT, ACK_BUTTON_TEXT } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const found = getApprovalByToken(params.token);
  if (!found) {
    return NextResponse.json({ error: "This approval link is not valid." }, { status: 404 });
  }
  markApprovalViewed(params.token);
  const { decision } = found;
  return NextResponse.json({
    approverName: found.approverName,
    approverRole: found.approverRole,
    status: found.status,
    consentText: CONSENT_TEXT,
    buttonText: ACK_BUTTON_TEXT,
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
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  const updated = respondToApproval(params.token, action, {
    role: body?.role,
    company: body?.company,
    ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  if (!updated) {
    return NextResponse.json({ error: "This approval link is not valid." }, { status: 404 });
  }
  return NextResponse.json({ status: updated.status });
}

import { NextRequest, NextResponse } from "next/server";
import { addEvidence } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (!body?.label || !body?.kind) {
    return NextResponse.json({ error: "Evidence needs a kind and label." }, { status: 400 });
  }
  const decision = addEvidence(params.id, {
    kind: body.kind,
    label: body.label,
    meta: body.meta,
    file: body.file,
  });
  if (!decision) {
    return NextResponse.json({ error: "Decision not found." }, { status: 404 });
  }
  return NextResponse.json({ decision });
}

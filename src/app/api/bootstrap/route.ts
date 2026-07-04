import { NextResponse } from "next/server";
import { listDecisions, listUsers, listProjects } from "@/lib/db";
import { emailConfigured, smsConfigured } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    decisions: listDecisions(),
    users: listUsers(),
    projects: listProjects(),
    config: {
      emailConfigured: emailConfigured(),
      smsConfigured: smsConfigured(),
    },
  });
}

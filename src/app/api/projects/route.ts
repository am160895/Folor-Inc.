import { NextRequest, NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ projects: listProjects() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }
  const project = createProject(body.name);
  return NextResponse.json({ project }, { status: 201 });
}

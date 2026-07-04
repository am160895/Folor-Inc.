import { NextRequest, NextResponse } from "next/server";
import { createUser, listUsers } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ users: listUsers() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  const user = createUser({
    name: body.name,
    role: body.role ?? "Team member",
    email: body.email,
    phone: body.phone,
    notifyEmail: body.notifyEmail,
    notifySms: body.notifySms,
  });
  return NextResponse.json({ user }, { status: 201 });
}

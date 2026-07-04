import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = sessionOf(req);
  if (!s) return unauthorized();
  return NextResponse.json({ name: s.name, email: s.email, isAdmin: s.isAdmin });
}

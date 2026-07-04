import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  logout(req.cookies.get(SESSION_COOKIE)?.value);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

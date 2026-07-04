import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = login(body?.email ?? "", body?.password ?? "");
  if (!session) {
    return NextResponse.json({ error: "Email or password not recognized." }, { status: 401 });
  }
  const res = NextResponse.json({
    name: session.name,
    email: session.email,
    isAdmin: session.isAdmin,
  });
  res.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

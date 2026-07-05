import { NextRequest, NextResponse } from "next/server";
import { verifySignup } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = verifySignup(typeof body?.token === "string" ? body.token : "");
  if (!session) {
    return NextResponse.json(
      { error: "This verification link is not valid or was already used." },
      { status: 404 }
    );
  }
  const res = NextResponse.json({ name: session.name, email: session.email });
  res.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

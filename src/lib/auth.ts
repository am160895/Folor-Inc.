import { NextRequest, NextResponse } from "next/server";
import { getSession, type SessionInfo } from "./db";

export const SESSION_COOKIE = "ledger_session";

/** Returns the active session for a request, or null. */
export function sessionOf(req: NextRequest): SessionInfo | null {
  return getSession(req.cookies.get(SESSION_COOKIE)?.value);
}

/** 401 response helper for guarded API routes. */
export function unauthorized() {
  return NextResponse.json({ error: "Sign in required." }, { status: 401 });
}

/** 403 response for admin-only actions. */
export function forbidden() {
  return NextResponse.json({ error: "Admin access required." }, { status: 403 });
}

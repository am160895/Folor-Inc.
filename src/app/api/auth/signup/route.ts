import { NextRequest, NextResponse } from "next/server";
import { createSignup, getSettings } from "@/lib/db";
import { sendVerification, emailConfigured } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password.trim() : "";
  if (!name) return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });
  }
  const result = createSignup(name, email, password);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  const base = (process.env.APP_URL?.replace(/\/$/, "") || new URL(req.url).origin) as string;
  const link = base + "/verify/" + result.token;
  const status = await sendVerification({
    toName: name,
    toEmail: email,
    workspaceName: getSettings().workspaceName,
    link,
  });
  return NextResponse.json({
    status,
    // Without an email provider there is no inbox to check — hand the
    // verification link straight back so the flow still works.
    verifyUrl: emailConfigured() ? undefined : link,
  });
}

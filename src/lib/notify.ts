import type { Decision, User } from "./types";
import { recordNotification, CONSENT_TEXT } from "./db";

// ---------------------------------------------------------------------------
// Notification sending.
//
// Works with zero configuration: without provider credentials every message
// is stored in the database with status "demo" so the full approval flow can
// be tested locally (open the approval link from the decision's detail view).
//
// To send for real, set environment variables in decisiongraph/.env.local:
//   Email (Resend):  RESEND_API_KEY=re_...      EMAIL_FROM="Folor <decisions@yourdomain.com>"
//   SMS   (Twilio):  TWILIO_ACCOUNT_SID=AC...   TWILIO_AUTH_TOKEN=...   TWILIO_FROM=+1555...
//   Public URL for links (optional, defaults to the request origin): APP_URL=https://...
// ---------------------------------------------------------------------------

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function smsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM
  );
}

/**
 * Approvers get an approve/decline link on their preferred channels.
 */
export async function notifyApprovers(
  decision: Decision,
  approvers: { user: User; token: string }[],
  requestOrigin: string
): Promise<void> {
  const base = process.env.APP_URL?.replace(/\/$/, "") || requestOrigin;

  for (const { user, token } of approvers) {
    const link = base + "/approve/" + token;
    const text =
      "Ledger: " +
      decision.recordedBy +
      " recorded a decision on " +
      decision.projectName +
      ': "' +
      decision.title +
      '". Approve or decline: ' +
      link;

    if (user.notifyEmail && user.email) {
      const status = await sendEmail(
        user.email,
        "Decision to approve: " + decision.title,
        approvalEmailHtml(decision, link)
      );
      recordNotification({
        decisionId: decision.id,
        userId: user.id,
        channel: "email",
        kind: "approval",
        destination: user.email,
        message: text,
        status,
      });
    }

    if (user.notifySms && user.phone) {
      const status = await sendSms(user.phone, text);
      recordNotification({
        decisionId: decision.id,
        userId: user.id,
        channel: "sms",
        kind: "approval",
        destination: user.phone,
        message: text,
        status,
      });
    }
  }
}

/**
 * Watchers get an FYI email — no action required, the decision itself is in
 * the message.
 */
export async function notifyWatchers(decision: Decision, watchers: User[]): Promise<void> {
  for (const user of watchers) {
    if (!(user.notifyEmail && user.email)) continue;
    const text =
      "Ledger: " +
      decision.recordedBy +
      " recorded a decision on " +
      decision.projectName +
      ': "' +
      decision.title +
      '" — you are on the visibility list. No action needed.';
    const status = await sendEmail(
      user.email,
      "Decision recorded: " + decision.title,
      fyiEmailHtml(decision)
    );
    recordNotification({
      decisionId: decision.id,
      userId: user.id,
      channel: "email",
      kind: "fyi",
      destination: user.email,
      message: text,
      status,
    });
  }
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<"sent" | "demo" | "failed"> {
  if (!emailConfigured()) return "demo";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Folor Ledger <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

async function sendSms(to: string, body: string): Promise<"sent" | "demo" | "failed"> {
  if (!smsConfigured()) return "demo";
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const auth = Buffer.from(sid + ":" + process.env.TWILIO_AUTH_TOKEN).toString("base64");
    const res = await fetch(
      "https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json",
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + auth,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM!, Body: body }),
      }
    );
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

function decisionCardHtml(decision: Decision): string {
  const impact = [
    decision.costImpact ?? "No cost impact",
    decision.scheduleImpact ?? "No schedule impact",
  ].join(" · ");
  return (
    '<div style="border:1px solid #e5e5e5;border-radius:12px;padding:16px;margin:16px 0">' +
    '<p style="margin:0 0 6px;font-weight:600">' + escapeHtml(decision.title) + "</p>" +
    '<p style="margin:0 0 10px;color:#444">' + escapeHtml(decision.summary) + "</p>" +
    '<p style="margin:0;font-size:13px;color:#666">' +
    escapeHtml(decision.projectName) + " · " + escapeHtml(decision.location || "—") + "<br/>" +
    "Recorded by " + escapeHtml(decision.recordedBy) + " · " +
    escapeHtml(decision.dateLabel) + ", " + escapeHtml(decision.timeLabel) + "<br/>" +
    escapeHtml(impact) +
    "</p></div>"
  );
}

function approvalEmailHtml(decision: Decision, link: string): string {
  return (
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">' +
    '<p style="font-size:13px;color:#666;margin:0 0 16px">Folor · Ledger</p>' +
    '<h2 style="margin:0 0 8px;font-size:20px">A decision needs your acknowledgement</h2>' +
    decisionCardHtml(decision) +
    '<a href="' + link + '" style="display:inline-block;background:#6d4aff;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">Review &amp; acknowledge</a>' +
    '<p style="font-size:11px;color:#999;margin-top:20px;line-height:1.5">' + CONSENT_TEXT + '</p>' +
    '<p style="font-size:11px;color:#bbb;margin-top:8px">This link is unique to you.</p>' +
    "</div>"
  );
}

function fyiEmailHtml(decision: Decision): string {
  return (
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">' +
    '<p style="font-size:13px;color:#666;margin:0 0 16px">Folor · Ledger</p>' +
    '<h2 style="margin:0 0 8px;font-size:20px">A decision was recorded</h2>' +
    '<p style="margin:0 0 4px;color:#444">You are on the visibility list — no action needed.</p>' +
    decisionCardHtml(decision) +
    "</div>"
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

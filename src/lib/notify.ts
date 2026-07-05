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

/**
 * Invite email — sent when a person with an email address is added to the
 * workspace or to a team. In demo mode (no RESEND_API_KEY) nothing is sent.
 */
export async function sendInvite(opts: {
  toName: string;
  toEmail: string;
  workspaceName: string;
  teamName?: string | null;
  password?: string | null;
  requestOrigin: string;
}): Promise<"sent" | "demo" | "failed"> {
  const base = process.env.APP_URL?.replace(/\/$/, "") || opts.requestOrigin;
  const subject = opts.teamName
    ? "You've been added to " + opts.teamName + " on Ledger"
    : "You've been added to Ledger";
  return sendEmail(opts.toEmail, subject, inviteEmailHtml(opts, base));
}

function inviteEmailHtml(
  o: { toName: string; toEmail: string; workspaceName: string; teamName?: string | null; password?: string | null },
  base: string
): string {
  const firstName = escapeHtml(o.toName.split(" ")[0]);
  const teamLine = o.teamName
    ? "You&#39;ve been added to the <strong>" + escapeHtml(o.teamName) + "</strong> team on "
    : "You&#39;ve been added to ";
  const passwordBlock = o.password
    ? '<p style="margin:0 0 4px;font-size:14px;color:#444">Your password:</p>' +
      '<p style="margin:0 0 16px;font-family:monospace;font-size:16px;font-weight:700;color:#111">' +
      escapeHtml(o.password) +
      "</p>"
    : '<p style="margin:0 0 16px;font-size:13px;color:#666">Your admin will share your password with you. You can set your own from the key icon once you&#39;re in.</p>';
  return (
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">' +
    '<p style="font-size:13px;color:#666;margin:0 0 16px">' + escapeHtml(o.workspaceName) + " · Ledger</p>" +
    '<h2 style="margin:0 0 8px;font-size:20px">Hi ' + firstName + " — you&#39;re in</h2>" +
    '<p style="margin:0 0 16px;color:#444">' + teamLine + "<strong>" + escapeHtml(o.workspaceName) +
    "</strong>&#39;s Ledger — where the team records project decisions so nothing important gets lost.</p>" +
    '<p style="margin:0 0 4px;font-size:14px;color:#444">Sign in with your email:</p>' +
    '<p style="margin:0 0 12px;font-family:monospace;font-size:15px;color:#111">' + escapeHtml(o.toEmail) + "</p>" +
    passwordBlock +
    '<a href="' + base + '" style="display:inline-block;background:#6d4aff;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">Open Ledger</a>' +
    '<p style="font-size:12px;color:#888;margin-top:16px">On your phone: open the link, then Share &rarr; Add to Home Screen to use it like an app.</p>' +
    "</div>"
  );
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
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
    '<td><a href="' + link + '" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:13px 24px;border-radius:10px;font-weight:600">&#10003;&nbsp; Acknowledge</a></td>' +
    '<td style="width:12px"></td>' +
    '<td><a href="' + link + '?intent=decline" style="display:inline-block;background:#fff;color:#b91c1c;border:1px solid #fca5a5;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600">&#10007;&nbsp; Decline</a></td>' +
    '</tr></table>' +
    '<p style="font-size:12px;color:#888;margin:14px 0 0">One tap — you&#39;ll confirm on the next screen.</p>' +
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

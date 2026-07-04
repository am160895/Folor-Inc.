"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, MapPin, Calendar, Users, Loader2, ShieldCheck } from "lucide-react";
import { LedgerMark } from "@/components/shared";

interface ApprovalData {
  approverName: string;
  approverRole: string;
  status: "pending" | "approved" | "declined";
  consentText: string;
  buttonText: string;
  decision: {
    id: string;
    title: string;
    summary: string;
    reason: string;
    location: string;
    projectName: string;
    recordedBy: string;
    dateLabel: string;
    timeLabel: string;
    costImpact: string | null;
    scheduleImpact: string | null;
    people: { name: string; role: string }[];
  };
}

export default function ApprovePage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<ApprovalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"approved" | "declined" | null>(null);
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const ROLES = ["Owner", "Architect", "Engineer", "GC", "Subcontractor", "Consultant", "Other"];

  useEffect(() => {
    fetch(`/api/approvals/${params.token}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Something went wrong.");
        setData(j);
        const match = ["Owner","Architect","Engineer","GC","Subcontractor","Consultant"].find(
          (r) => j.approverRole?.toLowerCase().includes(r.toLowerCase())
        );
        setRole(match ?? "Other");
        if (j.status !== "pending") setDone(j.status);
      })
      .catch((e) => setError(e.message));
  }, [params.token]);

  async function respond(action: "approved" | "declined") {
    setSubmitting(true);
    const r = await fetch(`/api/approvals/${params.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, role, company }),
    });
    setSubmitting(false);
    if (r.ok) setDone(action);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <LedgerMark size={28} />
          <span className="text-base font-semibold text-foreground">Ledger</span>
          <span className="rounded-md bg-white px-1.5 py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/folor-logo.png" alt="Folor" className="h-3 w-auto" />
          </span>
        </div>

        {error && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {error}
          </div>
        )}

        {!data && !error && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading decision…
          </div>
        )}

        {data && !done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-6 ring-hairline"
          >
            <p className="text-sm text-muted-foreground">
              Hi {data.approverName.split(" ")[0]} — {data.decision.recordedBy} recorded a
              decision that needs your response.
            </p>

            <h1 className="mt-4 text-xl font-semibold tracking-tight">{data.decision.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">
              {data.decision.summary}
            </p>
            {data.decision.reason && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Why: {data.decision.reason}
              </p>
            )}

            <div className="mt-4 space-y-2 rounded-xl border border-border/70 bg-white/[0.02] p-3.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {data.decision.dateLabel},{" "}
                {data.decision.timeLabel}
              </div>
              {data.decision.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {data.decision.location} ·{" "}
                  {data.decision.projectName}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {data.decision.people.map((p) => p.name.split(" ")[0]).join(", ") || "—"}
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                {data.decision.costImpact ?? "No cost impact"} ·{" "}
                {data.decision.scheduleImpact ?? "No schedule impact"}
              </div>
            </div>

            {/* Signer identity confirmation */}
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  I am signing as
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-white/[0.02] px-3 text-sm text-foreground outline-none focus:border-primary/50 [&>option]:bg-elevated"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  Company (optional)
                </div>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your company"
                  className="h-11 w-full rounded-xl border border-border bg-white/[0.02] px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-2.5">
              <button
                disabled={submitting}
                onClick={() => respond("approved")}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-4 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.7)] transition-transform hover:scale-[1.01] disabled:opacity-50"
              >
                <Check className="h-5 w-5" strokeWidth={3} />
                {data.buttonText}
              </button>
              <button
                disabled={submitting}
                onClick={() => respond("declined")}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white/[0.03] px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-red-400/40 hover:bg-red-500/10 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> This does not accurately reflect the decision
              </button>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/80">
              {data.consentText}
            </p>
            <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
              Ledger creates contemporaneous evidence trails that help teams reconstruct, support,
              and explain decisions. It does not replace signed change orders.
            </p>
          </motion.div>
        )}

        {data && done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-border bg-card p-8 text-center ring-hairline"
          >
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                done === "approved"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {done === "approved" ? (
                <Check className="h-7 w-7" strokeWidth={2.5} />
              ) : (
                <X className="h-7 w-7" strokeWidth={2.5} />
              )}
            </div>
            <h2 className="text-lg font-semibold">
              {done === "approved" ? "Decision approved" : "Decision declined"}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Thanks {data.approverName.split(" ")[0]} — your response to{" "}
              <span className="font-mono text-primary/90">{data.decision.id}</span> has been
              recorded and everyone on the decision can see it.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

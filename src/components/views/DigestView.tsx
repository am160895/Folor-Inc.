"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Sunrise, CheckCheck, Clock3, ShieldCheck, FileCheck2, Banknote, Timer } from "lucide-react";
import type { Decision } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StatusPill, ImpactPill } from "@/components/shared";

export function DigestView({
  decisions,
  onOpen,
}: {
  decisions: Decision[];
  onOpen: (d: Decision) => void;
}) {
  const digest = decisions.slice(0, 7);
  const pending = digest.filter((d) => d.status === "Pending").length;
  const [sent, setSent] = useState(false);

  // ---- Protection report — what this record is worth -----------------------
  const money = (v: string | null) => {
    if (!v) return 0;
    const m = v.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  };
  const exposure = decisions.reduce((sum, d) => sum + money(d.costImpact), 0);
  const withApprovals = decisions.filter((d) => d.approvals.length > 0);
  const acked = withApprovals.filter((d) => d.status === "Acknowledged").length;
  const ackRate = withApprovals.length ? Math.round((acked / withApprovals.length) * 100) : null;
  const responseHours: number[] = [];
  decisions.forEach((d) =>
    d.approvals.forEach((a) => {
      if (a.respondedAt) {
        const h = (new Date(a.respondedAt).getTime() - new Date(d.createdAt).getTime()) / 36e5;
        if (h >= 0) responseHours.push(h);
      }
    })
  );
  const avgResponse = responseHours.length
    ? responseHours.reduce((a, b) => a + b, 0) / responseHours.length
    : null;
  const evidenced = decisions.filter((d) => d.evidence.length > 0).length;
  const fmtMoney = (n: number) =>
    "$" + (n >= 1000 ? Math.round(n).toLocaleString("en-US") : n.toFixed(0));
  const fmtHours = (h: number) => (h < 1 ? Math.max(1, Math.round(h * 60)) + "m" : h < 48 ? Math.round(h) + "h" : Math.round(h / 24) + "d");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center gap-3 pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-primary/10 text-amber-300">
          <Sunrise className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Daily digest</h1>
          <p className="text-sm text-muted-foreground">
            Recent decisions and where their approvals stand.
          </p>
        </div>
      </div>

      {/* Protection report */}
      <div className="mt-6 rounded-2xl border border-border/80 bg-card ring-hairline">
        <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium">Protection report</span>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl bg-border/40 sm:grid-cols-4">
          <div className="bg-card p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
              <Banknote className="h-3 w-3" /> $ on record
            </div>
            <div className="mt-1 text-xl font-semibold tracking-tight">{fmtMoney(exposure)}</div>
            <div className="text-[11px] text-muted-foreground">cost impacts recorded</div>
          </div>
          <div className="bg-card p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
              <CheckCheck className="h-3 w-3" /> Acknowledged
            </div>
            <div className="mt-1 text-xl font-semibold tracking-tight">
              {ackRate === null ? "—" : ackRate + "%"}
            </div>
            <div className="text-[11px] text-muted-foreground">of decisions needing sign-off</div>
          </div>
          <div className="bg-card p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
              <Timer className="h-3 w-3" /> Avg response
            </div>
            <div className="mt-1 text-xl font-semibold tracking-tight">
              {avgResponse === null ? "—" : fmtHours(avgResponse)}
            </div>
            <div className="text-[11px] text-muted-foreground">from recorded to acknowledged</div>
          </div>
          <div className="bg-card p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
              <FileCheck2 className="h-3 w-3" /> Evidence
            </div>
            <div className="mt-1 text-xl font-semibold tracking-tight">
              {decisions.length ? Math.round((evidenced / decisions.length) * 100) + "%" : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground">decisions carry evidence</div>
          </div>
        </div>
      </div>
      <p className="mt-2 px-1 text-[11px] leading-relaxed text-muted-foreground/70">
        If any decision above is ever disputed, this record — who agreed, when, from where, with
        what evidence — is what you hand over.
      </p>

      <div className="mt-6 rounded-2xl border border-border/80 bg-card ring-hairline">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <span className="text-sm font-medium">Latest decisions</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {pending > 0 && <Clock3 className="h-3.5 w-3.5 text-amber-400" />}
            {pending > 0 ? `${pending} awaiting approval` : "All approved"}
          </span>
        </div>

        <div className="divide-y divide-border/50">
          {digest.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nothing to digest yet — record your first decision.
            </div>
          )}
          {digest.map((d, i) => (
            <motion.button
              key={d.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onOpen(d)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-primary/70">{d.id}</span>
                  <StatusPill status={d.status} />
                </div>
                <div className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {d.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {d.people.map((p) => p.name.split(" ")[0]).join(", ") || d.recordedBy}
                  {d.location ? ` · ${d.location}` : ""} · {d.dateLabel}
                </div>
              </div>
              <div className="hidden sm:block">
                <ImpactPill decision={d} />
              </div>
            </motion.button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-4">
          <Button onClick={() => setSent(true)} disabled={digest.length === 0 || sent}>
            <Send className="h-4 w-4" />
            {sent ? "Digest sent" : "Send digest"}
          </Button>
        </div>
      </div>

      {sent && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300"
        >
          <CheckCheck className="h-4 w-4" />
          Digest queued for everyone on the project. Connect email in Settings to deliver it for
          real.
        </motion.div>
      )}
    </div>
  );
}

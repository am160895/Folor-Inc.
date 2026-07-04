"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Sunrise, CheckCheck, Clock3 } from "lucide-react";
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

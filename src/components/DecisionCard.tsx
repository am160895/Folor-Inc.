"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, Paperclip } from "lucide-react";
import type { Decision } from "@/lib/types";
import { AvatarStack, StatusPill, ImpactPill, evidenceIcon } from "@/components/shared";

export function DecisionCard({
  decision,
  index,
  onClick,
}: {
  decision: Decision;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
      onClick={onClick}
      className="group w-full rounded-2xl border border-border/80 bg-card p-5 text-left ring-hairline transition-all hover:border-primary/30 hover:bg-elevated/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-[11px] text-primary/80">{decision.id}</span>
            <span className="text-[11px] text-muted-foreground/50">·</span>
            <span className="text-[11px] text-muted-foreground">{decision.projectName}</span>
          </div>
          <h3 className="text-[17px] font-semibold tracking-tight text-foreground transition-colors group-hover:text-white">
            {decision.title}
          </h3>
        </div>
        <StatusPill status={decision.status} />
      </div>

      <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
        {decision.summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <AvatarStack people={decision.people} />
          <span className="text-muted-foreground/90">
            {decision.people
              .slice(0, 2)
              .map((p) => p.name.split(" ")[0])
              .join(" + ")}
            {decision.people.length > 2 ? ` +${decision.people.length - 2}` : ""}
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> {decision.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {decision.dateLabel} · {decision.timeLabel}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3.5">
        <ImpactPill decision={decision} />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" />
            {decision.evidence.length} evidence
          </div>
          <div className="flex -space-x-1.5">
            {decision.evidence.slice(0, 4).map((e, i) => {
              const Icon = evidenceIcon[e.kind];
              return (
                <div
                  key={i}
                  title={e.label}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-elevated text-muted-foreground"
                >
                  <Icon className="h-3 w-3" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

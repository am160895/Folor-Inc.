"use client";

import { useState, useEffect } from "react";
import type { Decision, Project } from "@/lib/types";
import { DecisionFlow } from "@/components/DecisionFlow";
import { StatusPill } from "@/components/shared";

export function GraphView({
  decisions,
  projects,
  projectFilter,
  onSelectProject,
  onEditDecision,
}: {
  decisions: Decision[];
  projects: Project[];
  projectFilter: number | "all";
  onSelectProject: (id: number | "all") => void;
  onEditDecision: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(decisions[0]?.id ?? null);
  const selected = decisions.find((d) => d.id === selectedId) ?? decisions[0] ?? null;

  useEffect(() => {
    if (!selected && decisions.length > 0) setSelectedId(decisions[0].id);
  }, [decisions, selected]);

  if (decisions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
          <p className="text-sm font-medium text-foreground">No decisions to graph yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Record a decision and it will appear here with its people, reason, evidence, and
            approvals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Picker — sidebar on desktop, horizontal strip on mobile */}
      <div className="shrink-0 border-b border-border/70 bg-surface/30 md:w-[280px] md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="px-4 pb-2 pt-4 md:pb-0">
          <h2 className="text-sm font-semibold tracking-tight">Decision graph</h2>
          <p className="hidden text-xs text-muted-foreground md:block">
            One decision, fully explained by its connections.
          </p>
          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => onSelectProject("all")}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                projectFilter === "all"
                  ? "border-primary/50 bg-primary/[0.12] text-foreground"
                  : "border-border/70 bg-white/[0.02] text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={`max-w-[140px] shrink-0 truncate rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  projectFilter === p.id
                    ? "border-primary/50 bg-primary/[0.12] text-foreground"
                    : "border-border/70 bg-white/[0.02] text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto p-4 md:flex-col md:gap-1.5">
          {decisions.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`min-w-[220px] shrink-0 rounded-xl border px-3 py-2.5 text-left transition-colors md:min-w-0 ${
                selected?.id === d.id
                  ? "border-primary/40 bg-primary/[0.08]"
                  : "border-border/60 bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.03]"
              }`}
            >
              <div className="font-mono text-[10px] text-primary/70">{d.id}</div>
              <div className="mt-0.5 truncate text-sm font-medium text-foreground">{d.title}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {d.people.length} people · {d.evidence.length} evidence · {d.approvals.length}{" "}
                approvals
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Graph canvas */}
      <div className="relative min-h-[420px] flex-1">
        {selected && (
          <>
            <div className="absolute left-4 top-4 z-10 max-w-[75%] sm:left-6 sm:top-6 sm:max-w-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary/80">{selected.id}</span>
                <StatusPill status={selected.status} />
              </div>
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight sm:text-xl">
                {selected.title}
              </h3>
            </div>
            <DecisionFlow decision={selected} onNavigate={(id) => setSelectedId(id)} onEdit={onEditDecision} />
            <Legend />
          </>
        )}
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { c: "bg-sky-400", l: "People" },
    { c: "bg-amber-400", l: "Reason" },
    { c: "bg-emerald-400", l: "Impact" },
    { c: "bg-violet-400", l: "Evidence" },
    { c: "bg-emerald-400", l: "Approvals" },
    { c: "bg-fuchsia-400", l: "Caused / led to" },
  ];
  return (
    <div className="absolute bottom-4 right-4 z-10 hidden flex-wrap gap-x-4 gap-y-1.5 rounded-xl border border-border/70 bg-surface/80 px-4 py-2.5 backdrop-blur sm:bottom-6 sm:right-6 sm:flex">
      {items.map((i) => (
        <div key={i.l} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${i.c}`} />
          {i.l}
        </div>
      ))}
    </div>
  );
}

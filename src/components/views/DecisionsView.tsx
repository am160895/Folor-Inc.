"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, Clock3, FolderKanban, Plus, Check } from "lucide-react";
import type { Decision, Project } from "@/lib/types";
import { CaptureBar } from "@/components/CaptureBar";
import { DecisionCard } from "@/components/DecisionCard";
import { AvatarStack } from "@/components/shared";

export function DecisionsView({
  decisions,
  projects,
  projectFilter,
  onOpen,
  onCapture,
  onCreateProject,
}: {
  decisions: Decision[];
  projects: Project[];
  projectFilter: number | "all";
  onOpen: (d: Decision) => void;
  onCapture: (mode: "speak" | "type" | "upload") => void;
  onCreateProject: (name: string) => Promise<void>;
}) {
  const [addingProject, setAddingProject] = useState(false);
  const [newName, setNewName] = useState("");

  const acknowledged = decisions.filter((d) => d.status === "Acknowledged").length;
  const pending = decisions.filter((d) => d.status === "Pending").length;

  // Group the feed by project.
  const visibleProjects =
    projectFilter === "all" ? projects : projects.filter((p) => p.id === projectFilter);
  const groups = visibleProjects
    .map((p) => ({ project: p, items: decisions.filter((d) => d.projectId === p.id) }))
    .filter((gr) => projectFilter !== "all" || gr.items.length > 0 || projects.length <= 3);
  const unassigned = decisions.filter(
    (d) => !d.projectId || !projects.some((p) => p.id === d.projectId)
  );

  async function submitProject() {
    if (!newName.trim()) return;
    await onCreateProject(newName.trim());
    setNewName("");
    setAddingProject(false);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <CaptureBar onCapture={onCapture} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-8 grid grid-cols-3 gap-2 sm:gap-3"
      >
        <Stat icon={<TrendingUp className="h-4 w-4" />} value={decisions.length} label="Decisions" />
        <Stat
          icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
          value={acknowledged}
          label="Acknowledged"
        />
        <Stat
          icon={<Clock3 className="h-4 w-4 text-amber-400" />}
          value={pending}
          label="Awaiting approval"
        />
      </motion.div>

      {/* Projects header + add-from-home */}
      <div className="mt-8 flex items-center justify-between gap-3 sm:mt-10">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Every decision lives in its project — nothing gets lost.
          </p>
        </div>
        {addingProject ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitProject()}
              placeholder="Project name"
              className="h-9 w-40 rounded-lg border border-border bg-white/[0.03] px-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 sm:w-52"
            />
            <button
              onClick={submitProject}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingProject(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border/70 bg-white/[0.02] px-3 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/40"
          >
            <Plus className="h-4 w-4" /> New project
          </button>
        )}
      </div>

      {/* Grouped feed */}
      <div className="mt-5 space-y-8">
        {groups.map(({ project, items }) => (
          <section key={project.id}>
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-white/[0.02] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <FolderKanban className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-sm font-semibold text-foreground">
                  {project.name}
                </span>
                <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-muted-foreground">
                  {items.length} decision{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              {project.members.length > 0 && <AvatarStack people={project.members} />}
            </div>

            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 px-6 py-6 text-center text-sm text-muted-foreground">
                No decisions yet — record the first one above.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((d, i) => (
                  <DecisionCard key={d.id} decision={d} index={i} onClick={() => onOpen(d)} />
                ))}
              </div>
            )}
          </section>
        ))}

        {unassigned.length > 0 && projectFilter === "all" && (
          <section>
            <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-border/60 bg-white/[0.02] px-4 py-3">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">No project</span>
            </div>
            <div className="space-y-3">
              {unassigned.map((d, i) => (
                <DecisionCard key={d.id} decision={d} index={i} onClick={() => onOpen(d)} />
              ))}
            </div>
          </section>
        )}

        {groups.length === 0 && unassigned.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <p className="text-sm font-medium text-foreground">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a project above, then record your first decision.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3 ring-hairline sm:p-4">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

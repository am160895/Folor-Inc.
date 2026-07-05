"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, Clock3, FolderKanban, Plus, Check, ChevronRight, ArrowLeft } from "lucide-react";
import type { Decision, Project } from "@/lib/types";
import { CaptureBar } from "@/components/CaptureBar";
import { DecisionCard } from "@/components/DecisionCard";
import { Trash2 } from "lucide-react";
import { AvatarStack } from "@/components/shared";

export function DecisionsView({
  decisions,
  projects,
  projectFilter,
  onOpen,
  onCapture,
  onCreateProject,
  onSelectProject,
  isAdmin,
  onDelete,
}: {
  decisions: Decision[];
  projects: Project[];
  projectFilter: number | "all";
  onOpen: (d: Decision) => void;
  onCapture: (mode: "speak" | "type" | "upload") => void;
  onCreateProject: (name: string) => Promise<void>;
  onSelectProject: (id: number | "all") => void;
  isAdmin?: boolean;
  onDelete?: (d: Decision) => void;
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
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-border/60 ring-hairline">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://assets.awwwards.com/awards/element/2025/03/67d19efadcc35682823628_static.jpeg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
        <div className="relative px-6 py-7 sm:px-8 sm:py-9">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Every decision. Recorded.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Every decision. Protected. Say it, send it for approval, prove it forever.
          </p>
        </div>
      </div>

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
          {projectFilter !== "all" ? (
            <button
              onClick={() => onSelectProject("all")}
              className="mb-1 flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All projects
            </button>
          ) : null}
          <h2 className="text-lg font-semibold tracking-tight">
            {projectFilter === "all"
              ? "Projects"
              : projects.find((p) => p.id === projectFilter)?.name ?? "Projects"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {projectFilter === "all"
              ? "Every decision lives in its project — tap a folder to open it."
              : "All decisions on this project."}
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
            <button
              onClick={() => onSelectProject(projectFilter === project.id ? "all" : project.id)}
              className="group mb-3 flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-white/[0.04]"
              title={projectFilter === project.id ? "Back to all projects" : "Open this project"}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <FolderKanban className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-sm font-semibold text-foreground">
                  {project.name}
                </span>
                <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-muted-foreground">
                  {items.length} decision{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="flex shrink-0 items-center gap-2">
                {project.members.length > 0 && <AvatarStack people={project.members} />}
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>

            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 px-6 py-6 text-center text-sm text-muted-foreground">
                No decisions yet — record the first one above.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((d, i) => (
                  <DeletableCard key={d.id} d={d} i={i} onOpen={onOpen} isAdmin={isAdmin} onDelete={onDelete} />
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
                <DeletableCard key={d.id} d={d} i={i} onOpen={onOpen} isAdmin={isAdmin} onDelete={onDelete} />
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

function DeletableCard({
  d,
  i,
  onOpen,
  isAdmin,
  onDelete,
}: {
  d: Decision;
  i: number;
  onOpen: (d: Decision) => void;
  isAdmin?: boolean;
  onDelete?: (d: Decision) => void;
}) {
  return (
    <div className="group/card relative">
      <DecisionCard decision={d} index={i} onClick={() => onOpen(d)} />
      {isAdmin && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(d);
          }}
          title="Delete this decision"
          className="absolute bottom-3 right-3 rounded-lg p-1.5 text-muted-foreground/50 opacity-70 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover/card:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

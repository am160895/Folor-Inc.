"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutList,
  Search,
  Share2,
  Sunrise,
  Settings,
  Users,
  FolderKanban,
  Plus,
  Check,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENT_USER } from "@/lib/data";
import type { Project } from "@/lib/types";

export type ViewKey = "decisions" | "search" | "graph" | "people" | "digest" | "settings";

const NAV: { key: ViewKey; label: string; icon: LucideIcon }[] = [
  { key: "decisions", label: "Decisions", icon: LayoutList },
  { key: "search", label: "Search", icon: Search },
  { key: "graph", label: "Graph", icon: Share2 },
  { key: "people", label: "People", icon: Users },
  { key: "digest", label: "Digest", icon: Sunrise },
  { key: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  active,
  onNavigate,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
}: {
  active: ViewKey;
  onNavigate: (v: ViewKey) => void;
  projects: Project[];
  selectedProjectId: number | "all";
  onSelectProject: (id: number | "all") => void;
  onCreateProject: (name: string) => Promise<void>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const selectedName =
    selectedProjectId === "all"
      ? "All projects"
      : projects.find((p) => p.id === selectedProjectId)?.name ?? "All projects";

  async function submitNew() {
    if (!newName.trim()) return;
    await onCreateProject(newName.trim());
    setNewName("");
    setAdding(false);
    setPickerOpen(false);
  }

  return (
    <aside className="relative z-10 flex w-[248px] shrink-0 flex-col border-r border-border/70 bg-surface/40 px-3.5 py-5">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2.5 pb-4">
        <span className="flex items-center rounded-lg bg-white px-2 py-1.5 shadow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/folor-logo.png" alt="Folor" className="h-4 w-auto" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">DecisionGraph</div>
        </div>
      </div>

      {/* Project switcher */}
      <div className="relative px-0.5 pb-4">
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-white/15"
        >
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Project
            </div>
            <div className="truncate text-sm font-medium text-foreground">{selectedName}</div>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>

        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-border bg-elevated shadow-2xl"
            >
              <button
                onClick={() => {
                  onSelectProject("all");
                  setPickerOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-foreground hover:bg-white/5"
              >
                All projects
                {selectedProjectId === "all" && <Check className="h-4 w-4 text-primary" />}
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p.id);
                    setPickerOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-foreground hover:bg-white/5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FolderKanban className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{p.name}</span>
                  </span>
                  {selectedProjectId === p.id && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
              <div className="border-t border-border/70">
                {adding ? (
                  <div className="flex items-center gap-1.5 p-2">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitNew()}
                      placeholder="Project name"
                      className="h-8 w-full rounded-lg border border-border bg-white/[0.03] px-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
                    />
                    <button
                      onClick={submitNew}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAdding(true)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-white/5"
                  >
                    <Plus className="h-4 w-4" /> New project
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const isActive = active === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-white/[0.06] ring-hairline"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-4 w-4 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="relative z-10 font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="rounded-xl border border-border/70 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-primary/10 text-xs font-semibold">
              {CURRENT_USER.initials}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-xs font-medium">{CURRENT_USER.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">
                {CURRENT_USER.company}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

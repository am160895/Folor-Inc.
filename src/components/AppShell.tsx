"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutList,
  Search,
  Share2,
  Sunrise,
  Settings,
  Users,
  Loader2,
  ChevronsUpDown,
} from "lucide-react";
import { useState as useLocalState } from "react";
import { Plus, Check } from "lucide-react";
import { Sidebar, type ViewKey } from "@/components/Sidebar";
import { LedgerMark } from "@/components/shared";
import { DecisionsView } from "@/components/views/DecisionsView";
import { SearchView } from "@/components/views/SearchView";
import { GraphView } from "@/components/views/GraphView";
import { PeopleView } from "@/components/views/PeopleView";
import { DigestView } from "@/components/views/DigestView";
import { SettingsView } from "@/components/views/SettingsView";
import { DecisionDetails } from "@/components/DecisionDetails";
import { CaptureModal } from "@/components/CaptureModal";
import { LoginScreen } from "@/components/LoginScreen";
import type { Bootstrap, Decision } from "@/lib/types";

type CaptureMode = "speak" | "type" | "upload";

const MOBILE_NAV: { key: ViewKey; label: string; icon: typeof LayoutList }[] = [
  { key: "decisions", label: "Decisions", icon: LayoutList },
  { key: "search", label: "Search", icon: Search },
  { key: "graph", label: "Graph", icon: Share2 },
  { key: "people", label: "People", icon: Users },
  { key: "digest", label: "Digest", icon: Sunrise },
  { key: "settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const [view, setView] = useState<ViewKey>("decisions");
  const [data, setData] = useState<Bootstrap | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editSignal, setEditSignal] = useState(0);
  const [projectFilter, setProjectFilter] = useState<number | "all">("all");
  const [mobileProjectOpen, setMobileProjectOpen] = useState(false);
  const [capture, setCapture] = useState<{ open: boolean; mode: CaptureMode }>({
    open: false,
    mode: "type",
  });

  const [needsLogin, setNeedsLogin] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/bootstrap");
    if (res.ok) {
      setData(await res.json());
      setNeedsLogin(false);
    } else if (res.status === 401) {
      setNeedsLogin(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh when the window regains focus so approvals show up live.
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const openCapture = useCallback((mode: CaptureMode) => {
    setCapture({ open: true, mode });
  }, []);

  const createProject = useCallback(
    async (name: string) => {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await refresh();
    },
    [refresh]
  );

  const decisions = useMemo(() => {
    if (!data) return [];
    if (projectFilter === "all") return data.decisions;
    return data.decisions.filter((d) => d.projectId === projectFilter);
  }, [data, projectFilter]);

  const selected: Decision | null = useMemo(
    () => data?.decisions.find((d) => d.id === selectedId) ?? null,
    [data, selectedId]
  );

  if (needsLogin) {
    return <LoginScreen onSuccess={refresh} />;
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading Ledger…
      </div>
    );
  }

  const selectedProjectName =
    projectFilter === "all"
      ? "All projects"
      : data.projects.find((p) => p.id === projectFilter)?.name ?? "All projects";

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          active={view}
          onNavigate={setView}
          projects={data.projects}
          selectedProjectId={projectFilter}
          onSelectProject={setProjectFilter}
          onCreateProject={createProject}
          workspaceName={data.settings.workspaceName}
          isAdmin={data.me.isAdmin}
        />
      </div>

      {/* Mobile top bar */}
      <div className="relative z-20 flex items-center justify-between border-b border-border/70 bg-surface/60 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <LedgerMark size={24} />
          <span className="text-sm font-semibold tracking-tight">Ledger</span>
        </div>
        <button
          onClick={() => setMobileProjectOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-white/[0.02] px-2.5 py-1.5 text-xs font-medium text-foreground"
        >
          <span className="max-w-[130px] truncate">{selectedProjectName}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <AnimatePresence>
          {mobileProjectOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute right-4 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-elevated shadow-2xl"
            >
              <button
                onClick={() => {
                  setProjectFilter("all");
                  setMobileProjectOpen(false);
                }}
                className="block w-full px-3 py-2.5 text-left text-sm text-foreground hover:bg-white/5"
              >
                All projects
              </button>
              {data.projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProjectFilter(p.id);
                    setMobileProjectOpen(false);
                  }}
                  className="block w-full truncate px-3 py-2.5 text-left text-sm text-foreground hover:bg-white/5"
                >
                  {p.name}
                </button>
              ))}
              <MobileNewProject
                onCreate={async (name) => {
                  await createProject(name);
                  setMobileProjectOpen(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="relative z-10 flex-1 overflow-hidden pb-16 md:pb-0">
        <div className="h-full overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="h-full"
            >
              {view === "decisions" && (
                <DecisionsView
                  decisions={decisions}
                  projects={data.projects}
                  projectFilter={projectFilter}
                  onOpen={(d) => setSelectedId(d.id)}
                  onCapture={openCapture}
                  onCreateProject={createProject}
                  onSelectProject={setProjectFilter}
                />
              )}
              {view === "search" && (
                <SearchView decisions={decisions} onOpen={(d) => setSelectedId(d.id)} />
              )}
              {view === "graph" && (
                <GraphView
                  decisions={decisions}
                  projects={data.projects}
                  projectFilter={projectFilter}
                  onSelectProject={setProjectFilter}
                  onEditDecision={(id) => {
                    setSelectedId(id);
                    setEditSignal((n) => n + 1);
                  }}
                />
              )}
              {view === "people" && <PeopleView users={data.users} teams={data.teams} onChanged={refresh} />}
              {view === "digest" && (
                <DigestView decisions={decisions} onOpen={(d) => setSelectedId(d.id)} />
              )}
              {view === "settings" && <SettingsView config={data.config} settings={data.settings} teams={data.teams} onChanged={refresh} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border/70 bg-surface/90 backdrop-blur-xl md:hidden">
        {MOBILE_NAV.filter((item) => data.me.isAdmin || (item.key !== "people" && item.key !== "settings")).map((item) => {
          const Icon = item.icon;
          const isActive = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <DecisionDetails
        decision={selected}
        onClose={() => setSelectedId(null)}
        onOpenById={(id) => setSelectedId(id)}
        onChanged={refresh}
        editSignal={editSignal}
      />

      <CaptureModal
        open={capture.open}
        mode={capture.mode}
        users={data.users}
        projects={data.projects}
        decisions={data.decisions}
        teams={data.teams}
        settings={data.settings}
        defaultProjectId={projectFilter}
        onClose={() => setCapture((c) => ({ ...c, open: false }))}
        onRecorded={refresh}
        onPeopleChanged={refresh}
      />
    </div>
  );
}

function MobileNewProject({ onCreate }: { onCreate: (name: string) => Promise<void> }) {
  const [adding, setAdding] = useLocalState(false);
  const [name, setName] = useLocalState("");

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex w-full items-center gap-2 border-t border-border/70 px-3 py-2.5 text-left text-sm text-primary hover:bg-white/5"
      >
        <Plus className="h-4 w-4" /> New project
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5 border-t border-border/70 p-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && name.trim() && onCreate(name.trim())}
        placeholder="Project name"
        className="h-8 w-full rounded-lg border border-border bg-white/[0.03] px-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
      />
      <button
        onClick={() => name.trim() && onCreate(name.trim())}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Banknote,
  CheckCheck,
  Timer,
  FileCheck2,
  Users,
  FolderKanban,
  Mail,
  Eye,
  Smartphone,
  GitBranch,
  Download,
  ScrollText,
  TrendingUp,
  Mic,
} from "lucide-react";
import type { Decision, User, Project, Team } from "@/lib/types";

// ---------------------------------------------------------------------------
// Stats — every measurable thing in the workspace, plus the full activity log
// and CSV exports. All computed client-side from data the app already records.
// ---------------------------------------------------------------------------

const money = (v: string | null) => {
  if (!v) return 0;
  const m = v.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
};
const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const fmtHours = (h: number) =>
  h < 1 ? Math.max(1, Math.round(h * 60)) + "m" : h < 48 ? Math.round(h) + "h" : Math.round(h / 24) + "d";
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + "%" : "—");

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function StatsView({
  decisions,
  users,
  projects,
  teams,
  onOpenDecision,
}: {
  decisions: Decision[];
  users: User[];
  projects: Project[];
  teams: Team[];
  onOpenDecision?: (id: string) => void;
}) {
  const [drill, setDrill] = useState<{ title: string; items: Decision[] } | null>(null);
  const s = useMemo(() => {
    const total = decisions.length;
    const exposure = decisions.reduce((sum, d) => sum + money(d.costImpact), 0);
    const withCost = decisions.filter((d) => money(d.costImpact) > 0);
    const largest = withCost.slice().sort((a, b) => money(b.costImpact) - money(a.costImpact))[0] ?? null;

    const byStatus: Record<string, number> = {};
    decisions.forEach((d) => (byStatus[d.status] = (byStatus[d.status] ?? 0) + 1));

    const allApprovals = decisions.flatMap((d) => d.approvals.map((a) => ({ d, a })));
    const responded = allApprovals.filter(({ a }) => a.respondedAt);
    const opened = allApprovals.filter(({ a }) => a.viewedAt);
    const approved = allApprovals.filter(({ a }) => a.status === "approved");
    const declined = allApprovals.filter(({ a }) => a.status === "declined");
    const hours = responded
      .map(({ d, a }) => (new Date(a.respondedAt!).getTime() - new Date(d.createdAt).getTime()) / 36e5)
      .filter((h) => h >= 0)
      .sort((x, y) => x - y);
    const avgResponse = hours.length ? hours.reduce((x, y) => x + y, 0) / hours.length : null;
    const medianResponse = hours.length ? hours[Math.floor(hours.length / 2)] : null;
    const fastest = hours.length ? hours[0] : null;

    const devices: Record<string, number> = {};
    allApprovals.forEach(({ a }) => {
      if (a.device) devices[a.device] = (devices[a.device] ?? 0) + 1;
    });

    const notifs = decisions.flatMap((d) => d.notifications);
    const notifBy = (st: string) => notifs.filter((n) => n.status === st).length;

    const evidence = decisions.flatMap((d) => d.evidence);
    const evidenceBy: Record<string, number> = {};
    evidence.forEach((e) => (evidenceBy[e.kind] = (evidenceBy[e.kind] ?? 0) + 1));
    const evidenced = decisions.filter((d) => d.evidence.length > 0).length;

    const origins: Record<string, number> = {};
    decisions.forEach((d) => {
      const o = d.causedBy ? "Another decision" : d.origin || "Unspecified";
      origins[o] = (origins[o] ?? 0) + 1;
    });
    const linked = decisions.filter((d) => d.causedBy || d.ledTo.length > 0).length;

    const byProject = projects
      .map((p) => {
        const ds = decisions.filter((d) => d.projectId === p.id);
        return {
          name: p.name,
          count: ds.length,
          exposure: ds.reduce((sum, d) => sum + money(d.costImpact), 0),
          pending: ds.filter((d) => d.status === "Pending").length,
          acked: ds.filter((d) => d.status === "Acknowledged").length,
        };
      })
      .sort((a, b) => b.count - a.count);

    const byRecorder: Record<string, number> = {};
    decisions.forEach((d) => (byRecorder[d.recordedBy] = (byRecorder[d.recordedBy] ?? 0) + 1));
    const recorders = Object.entries(byRecorder).sort((a, b) => b[1] - a[1]);

    const byApprover: Record<string, { acks: number; pending: number; hours: number[] }> = {};
    allApprovals.forEach(({ d, a }) => {
      const row = (byApprover[a.name] ??= { acks: 0, pending: 0, hours: [] });
      if (a.status === "pending") row.pending++;
      else {
        row.acks++;
        if (a.respondedAt) {
          const h = (new Date(a.respondedAt).getTime() - new Date(d.createdAt).getTime()) / 36e5;
          if (h >= 0) row.hours.push(h);
        }
      }
    });
    const approvers = Object.entries(byApprover)
      .map(([name, r]) => ({
        name,
        acks: r.acks,
        pending: r.pending,
        avg: r.hours.length ? r.hours.reduce((x, y) => x + y, 0) / r.hours.length : null,
      }))
      .sort((a, b) => b.acks - a.acks);

    // Weekly recording activity, last 8 weeks
    const now = Date.now();
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = now - (8 - i) * 7 * 864e5;
      const end = start + 7 * 864e5;
      return decisions.filter((d) => {
        const t = new Date(d.createdAt).getTime();
        return t >= start && t < end;
      }).length;
    });

    // Full activity log across every decision (append-only events)
    const log = decisions
      .flatMap((d) => d.events.map((ev) => ({ ...ev, decisionId: d.id, decisionTitle: d.title })))
      .sort((a, b) => b.at.localeCompare(a.at));

    return {
      total, exposure, withCost, largest, byStatus, allApprovals, responded, opened,
      approved, declined, avgResponse, medianResponse, fastest, devices, notifs,
      notifBy, evidence, evidenceBy, evidenced, origins, linked, byProject,
      recorders, approvers, weeks, log,
    };
  }, [decisions, projects]);

  const maxWeek = Math.max(1, ...s.weeks);

  function exportDecisions() {
    downloadCsv("ledger-decisions.csv", [
      ["ID", "Title", "Summary", "Why", "Project", "Location", "Recorded by", "Created", "Status",
        "Cost impact", "Schedule impact", "Caused by", "Origin", "Approvers", "Watchers", "Evidence items"],
      ...decisions.map((d) => [
        d.id, d.title, d.summary, d.reason, d.projectName, d.location, d.recordedBy, d.createdAt,
        d.status, d.costImpact, d.scheduleImpact, d.causedBy?.id ?? "", d.origin ?? "",
        d.approvals.map((a) => `${a.name} (${a.status})`).join("; "),
        d.watchers.map((w) => w.name).join("; "), d.evidence.length,
      ]),
    ]);
  }

  function exportLog() {
    downloadCsv("ledger-activity-log.csv", [
      ["When", "Decision", "Title", "Event", "Actor", "Detail"],
      ...s.log.map((ev) => [ev.at, ev.decisionId, ev.decisionTitle, ev.type, ev.actor, ev.detail]),
    ]);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-fuchsia-500/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Stats</h1>
            <p className="text-sm text-muted-foreground">
              Everything the workspace has recorded, measured.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportDecisions} className="flex items-center gap-1.5 rounded-lg border border-border bg-white/[0.03] px-3 py-2 text-xs font-medium text-foreground hover:border-primary/40">
            <Download className="h-3.5 w-3.5" /> Decisions CSV
          </button>
          <button onClick={exportLog} className="flex items-center gap-1.5 rounded-lg border border-border bg-white/[0.03] px-3 py-2 text-xs font-medium text-foreground hover:border-primary/40">
            <Download className="h-3.5 w-3.5" /> Activity CSV
          </button>
        </div>
      </div>

      {/* Headline tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile icon={<GitBranch className="h-3.5 w-3.5" />} label="Decisions" value={String(s.total)} sub={`${s.linked} linked in chains`} onClick={() => setDrill({ title: "All decisions", items: decisions })} />
        <Tile icon={<Banknote className="h-3.5 w-3.5" />} label="$ on record" value={fmtMoney(s.exposure)} sub={`${s.withCost.length} carry cost`} onClick={() => setDrill({ title: "Decisions with cost on record", items: s.withCost })} />
        <Tile icon={<CheckCheck className="h-3.5 w-3.5" />} label="Acknowledgements" value={String(s.approved.length)} sub={`${s.declined.length} declined · ${s.allApprovals.length - s.responded.length} pending`} onClick={() => setDrill({ title: "Decisions with acknowledgements", items: decisions.filter((d) => d.approvals.length > 0) })} />
        <Tile icon={<Timer className="h-3.5 w-3.5" />} label="Avg response" value={s.avgResponse === null ? "—" : fmtHours(s.avgResponse)} sub={s.medianResponse === null ? "no responses yet" : `median ${fmtHours(s.medianResponse)} · fastest ${fmtHours(s.fastest!)}`} onClick={() => setDrill({ title: "Decisions with responses", items: decisions.filter((d) => d.approvals.some((a) => a.respondedAt)) })} />
        <Tile icon={<Eye className="h-3.5 w-3.5" />} label="Open rate" value={pct(s.opened.length, s.allApprovals.length)} sub="approval links opened" onClick={() => setDrill({ title: "Decisions where links were opened", items: decisions.filter((d) => d.approvals.some((a) => a.viewedAt)) })} />
        <Tile icon={<FileCheck2 className="h-3.5 w-3.5" />} label="Evidence coverage" value={pct(s.evidenced, s.total)} sub={`${s.evidence.length} evidence items`} onClick={() => setDrill({ title: "Decisions carrying evidence", items: decisions.filter((d) => d.evidence.length > 0) })} />
        <Tile icon={<Users className="h-3.5 w-3.5" />} label="People" value={String(users.length)} sub={`${teams.length} teams`} />
        <Tile icon={<FolderKanban className="h-3.5 w-3.5" />} label="Projects" value={String(projects.length)} sub={`${s.byProject.filter((p) => p.count > 0).length} active`} />
      </div>

      {/* Drill-down: what's behind the number you clicked */}
      {drill && (
        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/[0.04] ring-hairline">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <span className="text-sm font-medium">{drill.title} · {drill.items.length}</span>
            <button onClick={() => setDrill(null)} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground">
              Close ✕
            </button>
          </div>
          <div className="max-h-72 divide-y divide-border/40 overflow-y-auto">
            {drill.items.length === 0 && <p className="px-5 py-4 text-xs text-muted-foreground/70">Nothing here yet.</p>}
            {drill.items.map((d) => (
              <button
                key={d.id}
                onClick={() => onOpenDecision?.(d.id)}
                className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.04]"
              >
                <span className="font-mono text-[11px] text-primary/80">{d.id}</span>
                <span className="min-w-0 flex-1 truncate text-foreground/90">{d.title}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{d.status}{d.costImpact ? ` · ${d.costImpact}` : ""}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weekly activity */}
      <Section icon={<TrendingUp className="h-4 w-4" />} title="Recording activity — last 8 weeks">
        <div className="flex h-24 items-end gap-2 px-1">
          {s.weeks.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-primary/60" style={{ height: `${Math.max(4, (n / maxWeek) * 80)}px` }} />
              <span className="text-[10px] text-muted-foreground/70">{n}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Status + origins */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Section icon={<CheckCheck className="h-4 w-4" />} title="By status">
          {Object.entries(s.byStatus).map(([k, v]) => (
            <Bar key={k} label={k} value={v} max={s.total} onClick={() => setDrill({ title: `Status: ${k}`, items: decisions.filter((d) => d.status === k) })} />
          ))}
          {s.total === 0 && <Empty />}
        </Section>
        <Section icon={<Mic className="h-4 w-4" />} title="Where decisions come from">
          {Object.entries(s.origins).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
            <Bar key={k} label={k} value={v} max={s.total} onClick={() => setDrill({ title: `Came from: ${k}`, items: decisions.filter((d) => (d.causedBy ? "Another decision" : d.origin || "Unspecified") === k) })} />
          ))}
          {s.total === 0 && <Empty />}
        </Section>
      </div>

      {/* Projects table */}
      <Section icon={<FolderKanban className="h-4 w-4" />} title="By project">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground/70">
              <th className="pb-2 font-medium">Project</th>
              <th className="pb-2 text-right font-medium">Decisions</th>
              <th className="pb-2 text-right font-medium">$ on record</th>
              <th className="pb-2 text-right font-medium">Pending</th>
              <th className="pb-2 text-right font-medium">Acknowledged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {s.byProject.map((p) => (
              <tr
                key={p.name}
                onClick={() => setDrill({ title: `Project: ${p.name}`, items: decisions.filter((d) => d.projectName === p.name) })}
                className="cursor-pointer transition-colors hover:bg-white/[0.03]"
              >
                <td className="py-2 text-foreground/90">{p.name}</td>
                <td className="py-2 text-right">{p.count}</td>
                <td className="py-2 text-right">{fmtMoney(p.exposure)}</td>
                <td className="py-2 text-right">{p.pending}</td>
                <td className="py-2 text-right">{p.acked}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {s.byProject.length === 0 && <Empty />}
      </Section>

      {/* People performance */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Section icon={<Users className="h-4 w-4" />} title="Top recorders">
          {s.recorders.map(([name, n]) => (
            <Bar key={name} label={name} value={n} max={s.recorders[0]?.[1] ?? 1} onClick={() => setDrill({ title: `Recorded by ${name}`, items: decisions.filter((d) => d.recordedBy === name) })} />
          ))}
          {s.recorders.length === 0 && <Empty />}
        </Section>
        <Section icon={<CheckCheck className="h-4 w-4" />} title="Approver responsiveness">
          {s.approvers.map((a) => (
            <div
              key={a.name}
              onClick={() => setDrill({ title: `Approvals for ${a.name}`, items: decisions.filter((d) => d.approvals.some((x) => x.name === a.name)) })}
              className="flex cursor-pointer items-center justify-between rounded-md px-1 -mx-1 py-1 text-sm transition-colors hover:bg-white/[0.04]"
            >
              <span className="truncate text-foreground/90">{a.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {a.acks} responded{a.avg !== null ? ` · avg ${fmtHours(a.avg)}` : ""}{a.pending ? ` · ${a.pending} pending` : ""}
              </span>
            </div>
          ))}
          {s.approvers.length === 0 && <Empty />}
        </Section>
      </div>

      {/* Delivery + devices + evidence */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Section icon={<Mail className="h-4 w-4" />} title="Notifications">
          <Bar label="Sent" value={s.notifBy("sent")} max={Math.max(1, s.notifs.length)} />
          <Bar label="Demo" value={s.notifBy("demo")} max={Math.max(1, s.notifs.length)} />
          <Bar label="Failed" value={s.notifBy("failed")} max={Math.max(1, s.notifs.length)} />
        </Section>
        <Section icon={<Smartphone className="h-4 w-4" />} title="Signed from">
          {Object.entries(s.devices).map(([k, v]) => (
            <Bar key={k} label={k} value={v} max={Math.max(1, s.responded.length)} />
          ))}
          {Object.keys(s.devices).length === 0 && <Empty />}
        </Section>
        <Section icon={<FileCheck2 className="h-4 w-4" />} title="Evidence by type">
          {Object.entries(s.evidenceBy).map(([k, v]) => (
            <Bar key={k} label={k} value={v} max={Math.max(1, s.evidence.length)} />
          ))}
          {Object.keys(s.evidenceBy).length === 0 && <Empty />}
        </Section>
      </div>

      {/* Biggest decision */}
      {s.largest && (
        <Section icon={<Banknote className="h-4 w-4" />} title="Largest cost on record">
          <div
            onClick={() => onOpenDecision?.(s.largest!.id)}
            className="cursor-pointer rounded-lg text-sm text-foreground/90 transition-colors hover:text-primary"
          >
            <span className="font-mono text-primary/90">{s.largest.id}</span> — {s.largest.title}
            <span className="ml-2 font-semibold">{s.largest.costImpact}</span>
          </div>
        </Section>
      )}

      {/* Full activity log */}
      <Section icon={<ScrollText className="h-4 w-4" />} title={`Workspace activity log (${s.log.length} events)`}>
        <div className="max-h-96 space-y-0 overflow-y-auto pr-1">
          {s.log.slice(0, 200).map((ev, i) => (
            <div
              key={ev.decisionId + "-" + ev.id + "-" + i}
              onClick={() => onOpenDecision?.(ev.decisionId)}
              className="flex cursor-pointer items-start gap-2.5 border-b border-border/30 py-2 text-xs transition-colors last:border-0 hover:bg-white/[0.03]"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
              <div className="min-w-0 flex-1">
                <span className="text-foreground/90">{ev.actor}</span>{" "}
                <span className="text-muted-foreground">{ev.detail}</span>
                <div className="mt-0.5 text-[10px] text-muted-foreground/60">
                  <span className="font-mono">{ev.decisionId}</span> · {ev.decisionTitle} ·{" "}
                  {new Date(ev.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
              <span className="shrink-0 rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {ev.type.replace(/_/g, " ")}
              </span>
            </div>
          ))}
          {s.log.length === 0 && <Empty />}
        </div>
      </Section>

      <p className="mt-4 pb-4 text-[11px] leading-relaxed text-muted-foreground/60">
        Every number on this page is computed from the workspace&apos;s own records — decisions,
        acknowledgements, read receipts, notifications, evidence, and the append-only audit log.
        Export it any time; it&apos;s your data.
      </p>
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-border/80 bg-card p-4 ring-hairline ${
        onClick ? "cursor-pointer transition-colors hover:border-primary/40 hover:bg-elevated/60" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
        {icon} {label}
      </div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-border/80 bg-card ring-hairline">
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  onClick,
}: {
  label: string;
  value: number;
  max: number;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 py-1 ${onClick ? "cursor-pointer rounded-md px-1 -mx-1 transition-colors hover:bg-white/[0.04]" : ""}`}
    >
      <span className="w-28 shrink-0 truncate text-xs capitalize text-foreground/85">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function Empty() {
  return <p className="py-2 text-xs text-muted-foreground/70">Nothing recorded yet.</p>;
}

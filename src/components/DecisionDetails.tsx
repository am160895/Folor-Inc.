"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Sparkles,
  MapPin,
  Calendar,
  Eye,
  ShieldCheck,
  Clock3,
  XCircle,
  ExternalLink,
  Mail,
  MessageSquare,
  GitBranch,
  ArrowRight,
  UploadCloud,
  Loader2,
  Pencil,
  Check,
  FileCheck2,
  ScrollText,
  Trash2,
} from "lucide-react";
import type { Decision } from "@/lib/types";
import { DecisionFlow } from "@/components/DecisionFlow";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  StatusPill,
  ImpactPill,
  SectionLabel,
  Avatar,
  evidenceIcon,
} from "@/components/shared";

export function DecisionDetails({
  decision,
  onClose,
  onOpenById,
  onChanged,
  editSignal,
  isAdmin,
  projects,
}: {
  decision: Decision | null;
  onClose: () => void;
  onOpenById?: (id: string) => void;
  onChanged?: () => void;
  /** Increment to open the editor programmatically (e.g. from a graph node). */
  editSignal?: number;
  isAdmin?: boolean;
  projects?: { id: number; name: string }[];
}) {
  const [explaining, setExplaining] = useState(false);
  const [explained, setExplained] = useState(false);
  const [tab, setTab] = useState<"details" | "graph" | "audit">("details");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    reason: "",
    location: "",
    costImpact: "",
    scheduleImpact: "",
    origin: "",
    projectId: "" as number | "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  function startEdit() {
    if (!decision) return;
    setForm({
      title: decision.title,
      summary: decision.summary,
      reason: decision.reason,
      location: decision.location,
      costImpact: decision.costImpact ?? "",
      scheduleImpact: decision.scheduleImpact ?? "",
      origin: decision.origin ?? "",
      projectId: decision.projectId ?? "",
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!decision) return;
    setSavingEdit(true);
    await fetch(`/api/decisions/${decision.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        summary: form.summary,
        reason: form.reason,
        location: form.location,
        costImpact: form.costImpact || null,
        scheduleImpact: form.scheduleImpact || null,
        origin: form.origin || null,
        projectId: form.projectId === "" ? null : form.projectId,
      }),
    });
    setSavingEdit(false);
    setEditing(false);
    onChanged?.();
  }

  useEffect(() => {
    setExplained(false);
    setExplaining(false);
    setTab("details");
    setEditing(false);
  }, [decision?.id]);

  // Open the editor when asked from outside (graph node click).
  useEffect(() => {
    if (editSignal && decision) {
      setTab("details");
      startEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editSignal]);

  useEffect(() => {
    if (!decision) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decision, onClose]);

  function explain() {
    setExplaining(true);
    setExplained(false);
    setTimeout(() => {
      setExplaining(false);
      setExplained(true);
    }, 900);
  }

  return (
    <AnimatePresence>
      {decision && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[560px] flex-col border-l border-border bg-surface shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border/70 p-6">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-xs text-primary/80">{decision.id}</span>
                  <StatusPill status={decision.status} />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {decision.title}
                </h2>
                <div className="mt-1 text-xs text-muted-foreground">
                  {decision.projectName}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {isAdmin && (
                  <button
                    onClick={() => (editing ? setEditing(false) : startEdit())}
                    title={editing ? "Cancel editing" : "Edit this decision"}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete "${decision.title}" and its records? This cannot be undone.`)) return;
                      await fetch(`/api/decisions/${decision.id}`, { method: "DELETE" });
                      onClose();
                      onChanged?.();
                    }}
                    title="Delete this decision"
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border/60 px-6 pt-3">
              {(["details", "graph", "audit"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                    tab === t
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "details" ? "Details" : t === "graph" ? "Graph" : `Audit (${decision.events.length})`}
                </button>
              ))}
            </div>

            {tab === "audit" && (
              <div className="flex-1 overflow-y-auto p-6">
                <p className="mb-4 text-xs text-muted-foreground">
                  Append-only audit log — every event is recorded permanently and can never be
                  edited or deleted.
                </p>
                <div>
                  {decision.events.map((ev, i) => (
                    <div key={ev.id} className="relative flex gap-3 pb-5">
                      {i < decision.events.length - 1 && (
                        <span className="absolute left-[7px] top-4 h-full w-px bg-border" />
                      )}
                      <span
                        className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-2 ${
                          ev.type === "acknowledged"
                            ? "border-emerald-400 bg-emerald-400/20"
                            : ev.type === "declined"
                              ? "border-red-400 bg-red-400/20"
                              : ev.type === "created"
                                ? "border-primary bg-primary/20"
                                : "border-border bg-elevated"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-sm">
                          <span className="font-semibold uppercase tracking-wide text-foreground">
                            {ev.type.replace("_", " ")}
                          </span>
                          <span className="text-muted-foreground"> · {ev.actor}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(ev.at).toLocaleString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                            hour: "numeric", minute: "2-digit", second: "2-digit",
                          })}
                        </div>
                        {ev.detail && (
                          <div className="mt-0.5 text-xs text-foreground/70">{ev.detail}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "graph" && (
              <div className="min-h-0 flex-1">
                <DecisionFlow
                  decision={decision}
                  onNavigate={(id) => onOpenById?.(id)}
                  onEdit={() => {
                    setTab("details");
                    startEdit();
                  }}
                />
              </div>
            )}

            {/* Body */}
            <div className={`flex-1 space-y-7 overflow-y-auto p-6 ${tab === "graph" ? "hidden" : ""}`}>
              {editing && (
                <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/[0.05] p-4">
                  <Field label="Title">
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </Field>
                  <Field label="Decision">
                    <Textarea
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                      className="min-h-[72px]"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Why">
                      <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                    </Field>
                    <Field label="Location">
                      <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    </Field>
                    <Field label="Cost impact">
                      <Input
                        value={form.costImpact}
                        onChange={(e) => setForm({ ...form, costImpact: e.target.value })}
                        placeholder="e.g. +$2,500"
                      />
                    </Field>
                    <Field label="Schedule impact">
                      <Input
                        value={form.scheduleImpact}
                        onChange={(e) => setForm({ ...form, scheduleImpact: e.target.value })}
                        placeholder="e.g. +2 days"
                      />
                    </Field>
                  </div>
                  <Field label="Project">
                    <select
                      value={form.projectId}
                      onChange={(e) =>
                        setForm({ ...form, projectId: e.target.value === "" ? "" : Number(e.target.value) })
                      }
                      className="h-10 w-full rounded-xl border border-border bg-white/[0.02] px-3 text-sm text-foreground outline-none focus:border-primary/50 [&>option]:bg-elevated"
                    >
                      <option value="">No project</option>
                      {(projects ?? []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Caused by (origin)">
                    <Input
                      value={form.origin}
                      onChange={(e) => setForm({ ...form, origin: e.target.value })}
                      placeholder="e.g. Site visit, Phone call"
                    />
                  </Field>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit} disabled={savingEdit || !form.title.trim()}>
                      {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Save changes
                    </Button>
                  </div>
                </div>
              )}

              <Field label="Decision">
                <p className="text-[15px] leading-relaxed text-foreground/90">
                  {decision.summary}
                </p>
              </Field>

              {decision.reason && (
                <Field label="Why">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {decision.reason}
                  </p>
                </Field>
              )}

              {decision.people.length > 0 && (
                <Field label="People">
                  <div className="space-y-2.5">
                    {decision.people.map((p) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <Avatar person={p} />
                        <div className="leading-tight">
                          <div className="text-sm font-medium text-foreground">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Field>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date">
                  <div className="flex items-center gap-2 text-sm text-foreground/90">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {decision.dateLabel}, {decision.timeLabel}
                  </div>
                </Field>
                <Field label="Location">
                  <div className="flex items-center gap-2 text-sm text-foreground/90">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {decision.location || "—"}
                  </div>
                </Field>
              </div>

              <Field label="Impact">
                <ImpactPill decision={decision} />
              </Field>

              {(decision.causedBy || decision.origin || decision.ledTo.length > 0) && (
                <Field label="Decision chain">
                  <div className="flex flex-wrap items-center gap-2">
                    {decision.origin && !decision.causedBy && (
                      <span className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-3 py-1.5 text-xs text-amber-200">
                        <GitBranch className="h-3 w-3" />
                        Came from: {decision.origin}
                      </span>
                    )}
                    {decision.causedBy && (
                      <button
                        onClick={() => onOpenById?.(decision.causedBy!.id)}
                        className="flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/[0.08] px-3 py-1.5 text-xs text-fuchsia-200 transition-colors hover:border-fuchsia-400/60"
                      >
                        <GitBranch className="h-3 w-3" />
                        Caused by: {decision.causedBy.title.slice(0, 32)}
                      </button>
                    )}
                    {decision.ledTo.map((ref) => (
                      <button
                        key={ref.id}
                        onClick={() => onOpenById?.(ref.id)}
                        className="flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/[0.08] px-3 py-1.5 text-xs text-fuchsia-200 transition-colors hover:border-fuchsia-400/60"
                      >
                        Led to: {ref.title.slice(0, 32)}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              <Field label="Evidence">
                <div className="grid gap-2">
                  {decision.evidence.map((e, i) => {
                    const Icon = evidenceIcon[e.kind];
                    const inner = (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 leading-tight">
                          <div className="truncate text-sm font-medium text-foreground">
                            {e.label}
                          </div>
                          {e.meta && <div className="text-xs text-muted-foreground">{e.meta}</div>}
                        </div>
                        {e.file && (
                          <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </>
                    );
                    return e.file ? (
                      <a
                        key={i}
                        href={`/api/files/${e.file}`}
                        target="_blank"
                        className="flex items-center gap-3 rounded-xl border border-border/70 bg-white/[0.02] px-3.5 py-2.5 transition-colors hover:border-primary/30"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-border/70 bg-white/[0.02] px-3.5 py-2.5"
                      >
                        {inner}
                      </div>
                    );
                  })}
                </div>
                <EvidenceDrop decisionId={decision.id} onChanged={onChanged} />
              </Field>

              {/* Approvals */}
              <Field label="Approvals">
                <div className="rounded-xl border border-border/70 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-muted-foreground">Recorded by</span>
                    <span className="font-medium text-foreground">{decision.recordedBy}</span>
                  </div>

                  {decision.approvals.length === 0 && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No approvers were requested for this decision.
                    </p>
                  )}

                  {decision.approvals.map((a) => (
                    <div
                      key={a.id}
                      className="mt-2.5 flex items-center gap-2 border-t border-border/50 pt-2.5 text-sm"
                    >
                      {a.status === "approved" && (
                        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                      )}
                      {a.status === "pending" && (
                        <Clock3 className="h-4 w-4 shrink-0 text-amber-400" />
                      )}
                      {a.status === "declined" && (
                        <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium text-foreground">{a.name}</span>{" "}
                        <span className="text-muted-foreground">· {a.role}</span>
                      </span>
                      {a.status === "pending" ? (
                        <span className="flex shrink-0 items-center gap-2">
                          <a
                            href={`/email/${a.token}`}
                            target="_blank"
                            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                            title="Preview the email this person receives"
                          >
                            Email
                          </a>
                          <span
                            className={`text-[11px] ${
                              a.viewedAt ? "text-sky-300" : "text-muted-foreground/70"
                            }`}
                            title={a.viewedAt ? "Opened their approval link" : "Has not opened the link yet"}
                          >
                            {a.viewedAt ? "Seen ✓" : "Not seen"}
                          </span>
                          <a
                            href={`/approve/${a.token}`}
                            target="_blank"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> Link
                          </a>
                        </span>
                      ) : (
                        <span
                          className={`shrink-0 text-xs ${
                            a.status === "approved" ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {a.status === "approved" ? "Acknowledged" : "Declined"}
                          {a.ip ? ` · ${a.device ?? "?"} · ${a.ip}` : ""}
                        </span>
                      )}
                    </div>
                  ))}

                  {decision.watchers.map((w) => (
                    <div
                      key={`w-${w.id}`}
                      className="mt-2.5 flex items-center gap-2 border-t border-border/50 pt-2.5 text-sm"
                    >
                      <Eye className="h-4 w-4 shrink-0 text-sky-300" />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium text-foreground">{w.name}</span>{" "}
                        <span className="text-muted-foreground">· {w.role}</span>
                      </span>
                      <span className="shrink-0 text-xs text-sky-300">Can see</span>
                    </div>
                  ))}

                  <div className="mt-3 flex items-start gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <Eye className="mt-0.5 h-3.5 w-3.5" />
                    <span>
                      Visible to{" "}
                      {decision.visibleTo.map((v, i) => (
                        <span key={v} className="text-foreground/80">
                          {v}
                          {i < decision.visibleTo.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              </Field>

              {/* Notification log */}
              {decision.notifications.length > 0 && (
                <Field label="Notifications sent">
                  <div className="grid gap-1.5">
                    {decision.notifications.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg border border-border/60 bg-white/[0.015] px-3 py-2 text-sm"
                      >
                      <div className="flex items-center gap-2.5">
                        {n.channel === "email" ? (
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0 flex-1 truncate text-foreground/85">
                          {n.userName} · {n.destination}
                        </span>
                        <Badge
                          variant={
                            n.status === "sent"
                              ? "success"
                              : n.status === "demo"
                                ? "default"
                                : "warning"
                          }
                        >
                          {n.status === "sent" ? "Sent" : n.status === "demo" ? "Demo" : "Failed"}
                        </Badge>
                      </div>
                      {n.status === "failed" && n.detail && (
                        <div className="mt-1 pl-6 text-xs leading-relaxed text-amber-300/80">
                          {n.detail}
                        </div>
                      )}
                      </div>
                    ))}
                  </div>
                </Field>
              )}

              {/* Generate Evidence */}
              <div className="grid grid-cols-2 gap-2">
                <Button asChild className="w-full">
                  <a href={`/evidence/${decision.id}`} target="_blank">
                    <FileCheck2 className="h-4 w-4" />
                    Generate Evidence
                  </a>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <a href={`/certificate/${decision.id}`} target="_blank">
                    <ScrollText className="h-4 w-4" />
                    Audit certificate
                  </a>
                </Button>
              </div>

              {/* Explain this decision */}
              <div>
                <Button
                  onClick={explain}
                  disabled={explaining}
                  variant="secondary"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  {explaining ? "Analyzing decision record…" : "Explain this decision"}
                </Button>

                <AnimatePresence>
                  {explained && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <ExplainPanel decision={decision} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

function ExplainPanel({ decision }: { decision: Decision }) {
  const approved = decision.approvals.filter((a) => a.status === "approved");
  const pending = decision.approvals.filter((a) => a.status === "pending");

  const rows = [
    { label: "Why", value: decision.reason || "No reason recorded." },
    {
      label: "Who",
      value: decision.people.map((p) => p.name).join(", ") || decision.recordedBy,
    },
    { label: "When", value: `${decision.dateLabel}, ${decision.timeLabel}` },
    {
      label: "Evidence",
      value: decision.evidence.map((e) => e.label).join(", ") || "None attached",
    },
    { label: "Cost", value: decision.costImpact ?? "No cost impact recorded" },
    { label: "Schedule", value: decision.scheduleImpact ?? "No schedule impact recorded" },
  ];

  const summarySentence = [
    `This decision was recorded by ${decision.recordedBy}`,
    decision.location ? ` at the ${decision.location.toLowerCase()}` : "",
    decision.reason ? ` because ${decision.reason.replace(/\.$/, "").toLowerCase()}` : "",
    ". ",
    decision.people.length
      ? `${decision.people.map((p) => p.name.split(" ")[0]).join(" and ")} ${
          decision.people.length > 1 ? "were" : "was"
        } involved. `
      : "",
    decision.costImpact || decision.scheduleImpact
      ? "It carries a recorded impact, detailed below. "
      : "No cost or schedule impact was recorded. ",
    approved.length
      ? `Approved by ${approved.map((a) => a.name.split(" ")[0]).join(", ")}. `
      : "",
    pending.length
      ? `Still awaiting ${pending.map((a) => a.name.split(" ")[0]).join(", ")}. `
      : "",
    decision.evidence.length
      ? `Supported by ${decision.evidence.length} piece${
          decision.evidence.length > 1 ? "s" : ""
        } of evidence.`
      : "",
  ].join("");

  return (
    <div className="mt-3 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.08] to-transparent p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold text-foreground">AI explanation</span>
        <Badge variant="default" className="ml-auto">
          {decision.confidence}% confidence
        </Badge>
      </div>

      <p className="text-sm leading-relaxed text-foreground/90">{summarySentence}</p>

      <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[90px_1fr] gap-3 bg-surface px-3.5 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              {r.label}
            </span>
            <span className="text-sm text-foreground/90">{r.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium text-foreground">{decision.confidence}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${decision.confidence}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
      </div>
    </div>
  );
}

function EvidenceDrop({
  decisionId,
  onChanged,
}: {
  decisionId: string;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  async function upload(files: FileList) {
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await res.json();
        if (!res.ok) continue;
        await fetch(`/api/decisions/${decisionId}/evidence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(j.evidence),
        });
      }
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
      }}
      className={`mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3.5 text-sm transition-colors ${
        over
          ? "border-primary/60 bg-primary/[0.08] text-foreground"
          : "border-border/70 text-muted-foreground hover:border-white/20 hover:text-foreground"
      }`}
    >
      <input
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && upload(e.target.files)}
      />
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <UploadCloud className="h-4 w-4" />
      )}
      {busy ? "Uploading…" : "Drop files here to add evidence"}
    </label>
  );
}

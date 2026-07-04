"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  Loader2,
  MapPin,
  Users,
  DollarSign,
  CalendarClock,
  AlertTriangle,
  ExternalLink,
  Mail,
  MessageSquare,
  Eye,
  UploadCloud,
  X,
  GitBranch,
  Wand2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionLabel, evidenceIcon } from "@/components/shared";
import { draftFromText, tidyText } from "@/lib/data";
import type { User, Project, Decision, Evidence } from "@/lib/types";

type Mode = "speak" | "type" | "upload";
type Stage = "input" | "drafting" | "draft" | "saving" | "recorded";
type Involvement = "off" | "see" | "approve";

const SAMPLE =
  "We agreed onsite to center the linear lights on the soffit instead of the ceiling grid because it looked cleaner. No cost impact.";

export function CaptureModal({
  open,
  mode,
  users,
  projects,
  decisions,
  defaultProjectId,
  onClose,
  onRecorded,
}: {
  open: boolean;
  mode: Mode;
  users: User[];
  projects: Project[];
  decisions: Decision[];
  defaultProjectId: number | "all";
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [stage, setStage] = useState<Stage>("input");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // draft fields (editable)
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");
  const [costImpact, setCostImpact] = useState("");
  const [scheduleImpact, setScheduleImpact] = useState("");
  const [projectId, setProjectId] = useState<number | "new" | "">("");
  const [newProjectName, setNewProjectName] = useState("");
  const [involvement, setInvolvement] = useState<Record<number, Involvement>>({});
  const [causedById, setCausedById] = useState<string>("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tidied, setTidied] = useState(false);

  const [recorded, setRecorded] = useState<Decision | null>(null);

  // ---- Voice input (Web Speech API) ----------------------------------------
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef("");

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    baseTextRef.current = text ? text.trim() + " " : "";
    rec.onresult = (e: any) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setText((baseTextRef.current + final + interim).trimStart());
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      setListening(false);
      if (e.error === "not-allowed") {
        setError("Microphone access was blocked. Allow the mic in your browser, or type instead.");
      }
    };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [text]);

  // ---- lifecycle ------------------------------------------------------------
  useEffect(() => {
    if (open) {
      setStage("input");
      setText("");
      setError(null);
      setRecorded(null);
      setEvidence([]);
      setTidied(false);
      setCausedById("");
      setProjectId(defaultProjectId === "all" ? "" : defaultProjectId);
      setNewProjectName("");
      setInvolvement({});
      if (mode === "speak") {
        const t = setTimeout(() => startListening(), 350);
        return () => clearTimeout(t);
      }
    } else {
      stopListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  function generate() {
    stopListening();
    setStage("drafting");
    const d = draftFromText(text || SAMPLE, users);
    setTimeout(() => {
      setTitle(d.title);
      setSummary(d.decision);
      setReason(d.reason);
      setLocation(d.location);
      setCostImpact(d.costImpact ?? "");
      setScheduleImpact(d.scheduleImpact ?? "");

      // Default involvement: mentioned people must approve; the rest of the
      // project team can see it.
      const inv: Record<number, Involvement> = {};
      const proj =
        typeof projectId === "number" ? projects.find((p) => p.id === projectId) : undefined;
      proj?.members.forEach((m) => {
        if (m.id) inv[m.id] = "see";
      });
      d.matchedUserIds.forEach((id) => (inv[id] = "approve"));
      setInvolvement(inv);
      setStage("draft");
    }, 800);
  }

  function cleanUp() {
    setTitle((t) => tidyText(t, { title: true }));
    setSummary((s) => tidyText(s));
    setReason((r) => (r ? tidyText(r) : r));
    setTidied(true);
    setTimeout(() => setTidied(false), 1600);
  }

  async function handleFiles(files: FileList | File[]) {
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Upload failed.");
        setEvidence((prev) => [...prev, j.evidence]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function record() {
    setStage("saving");
    setError(null);
    try {
      const watcherIds = Object.entries(involvement)
        .filter(([, v]) => v === "see")
        .map(([k]) => parseInt(k, 10));
      const approverIds = Object.entries(involvement)
        .filter(([, v]) => v === "approve")
        .map(([k]) => parseInt(k, 10));

      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          reason,
          location,
          projectId: typeof projectId === "number" ? projectId : null,
          newProjectName: projectId === "new" ? newProjectName : undefined,
          costImpact: costImpact || null,
          scheduleImpact: scheduleImpact || null,
          watcherIds,
          approverIds,
          causedById: causedById || null,
          evidence,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not record the decision.");
      setRecorded(j.decision);
      setStage("recorded");
      onRecorded();
    } catch (e: any) {
      setError(e.message);
      setStage("draft");
    }
  }

  function cycleInvolvement(id: number) {
    setInvolvement((prev) => {
      const cur = prev[id] ?? "off";
      const next: Involvement = cur === "off" ? "see" : cur === "see" ? "approve" : "off";
      return { ...prev, [id]: next };
    });
  }

  const approverCount = Object.values(involvement).filter((v) => v === "approve").length;
  const projectDecisions = decisions.filter(
    (d) => typeof projectId !== "number" || d.projectId === projectId
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto p-0" hideClose>
        <AnimatePresence mode="wait">
          {stage === "input" && (
            <Step key="input">
              <Header
                title="What was decided?"
                subtitle="Say it or type it in plain language — DecisionGraph structures the rest."
              />
              <div className="px-6 pb-6">
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3">
                  <button
                    onClick={listening ? stopListening : startListening}
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary/30"
                    title={listening ? "Stop listening" : "Start speaking"}
                  >
                    {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    {listening && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                    )}
                  </button>
                  <div className="min-w-0 text-sm">
                    {listening ? (
                      <span className="text-foreground">Listening… tap again to stop</span>
                    ) : speechSupported ? (
                      <span className="text-muted-foreground">Tap the mic and just talk, or type below</span>
                    ) : (
                      <span className="text-amber-300">Voice needs Chrome or Edge — type below instead</span>
                    )}
                  </div>
                  {listening && <VoiceBars />}
                </div>

                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={SAMPLE}
                  className="min-h-[120px] text-[15px]"
                  autoFocus={mode !== "speak"}
                />
                {error && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" /> {error}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => setText(SAMPLE)}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Use sample
                  </button>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button size="lg" onClick={generate} disabled={!text.trim()}>
                      <Sparkles className="h-4 w-4" />
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </Step>
          )}

          {stage === "drafting" && (
            <Step key="drafting">
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">Structuring the decision</div>
                  <div className="text-xs text-muted-foreground">
                    Extracting people, location, reason, and impact…
                  </div>
                </div>
              </div>
            </Step>
          )}

          {(stage === "draft" || stage === "saving") && (
            <Step key="draft">
              <div className="flex items-start justify-between border-b border-border/60 p-6 pb-5">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Review &amp; send
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Adjust anything, tap people to set who sees or approves, then record.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={cleanUp}>
                  <Wand2 className="h-3.5 w-3.5 text-primary" />
                  {tidied ? "Cleaned ✓" : "Clean up with AI"}
                </Button>
              </div>

              <div className="space-y-4 px-6 pb-2 pt-4">
                <DraftField label="Title">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </DraftField>
                <DraftField label="Decision">
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="min-h-[72px]"
                  />
                </DraftField>
                <div className="grid grid-cols-2 gap-4">
                  <DraftField label="Why">
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Optional"
                    />
                  </DraftField>
                  <DraftField label="Location" icon={<MapPin className="h-3.5 w-3.5" />}>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Lobby soffit"
                    />
                  </DraftField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <DraftField label="Cost impact" icon={<DollarSign className="h-3.5 w-3.5" />}>
                    <Input
                      value={costImpact}
                      onChange={(e) => setCostImpact(e.target.value)}
                      placeholder="Leave empty for none"
                    />
                  </DraftField>
                  <DraftField label="Schedule impact" icon={<CalendarClock className="h-3.5 w-3.5" />}>
                    <Input
                      value={scheduleImpact}
                      onChange={(e) => setScheduleImpact(e.target.value)}
                      placeholder="Leave empty for none"
                    />
                  </DraftField>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DraftField label="Project">
                    <div className="flex gap-2">
                      <select
                        value={projectId}
                        onChange={(e) =>
                          setProjectId(
                            e.target.value === "new"
                              ? "new"
                              : e.target.value === ""
                                ? ""
                                : parseInt(e.target.value, 10)
                          )
                        }
                        className="h-10 w-full rounded-lg border border-border bg-white/[0.02] px-3 text-sm text-foreground outline-none focus:border-primary/50 [&>option]:bg-elevated"
                      >
                        <option value="">No project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                        <option value="new">+ New project…</option>
                      </select>
                      {projectId === "new" && (
                        <Input
                          autoFocus
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="Project name"
                        />
                      )}
                    </div>
                  </DraftField>

                  <DraftField label="Caused by" icon={<GitBranch className="h-3.5 w-3.5" />}>
                    <select
                      value={causedById}
                      onChange={(e) => setCausedById(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-white/[0.02] px-3 text-sm text-foreground outline-none focus:border-primary/50 [&>option]:bg-elevated"
                    >
                      <option value="">Not linked to an earlier decision</option>
                      {projectDecisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.id} — {d.title.slice(0, 40)}
                        </option>
                      ))}
                    </select>
                  </DraftField>
                </div>

                {/* People: tap to cycle Off -> Can see -> Must approve */}
                <DraftField label="People on this decision" icon={<Users className="h-3.5 w-3.5" />}>
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No people yet — add teammates on the People page first.
                    </p>
                  ) : (
                    <>
                      <div className="grid gap-1.5">
                        {users.map((u) => {
                          const inv = involvement[u.id] ?? "off";
                          return (
                            <button
                              key={u.id}
                              onClick={() => cycleInvolvement(u.id)}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                                inv === "approve"
                                  ? "border-primary/50 bg-primary/[0.1]"
                                  : inv === "see"
                                    ? "border-sky-400/30 bg-sky-400/[0.06]"
                                    : "border-border/70 bg-white/[0.01] hover:border-white/15"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-foreground">{u.name}</div>
                                <div className="text-xs text-muted-foreground">{u.role}</div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                                {u.notifyEmail && u.email && <Mail className="h-3.5 w-3.5" />}
                                {u.notifySms && u.phone && <MessageSquare className="h-3.5 w-3.5" />}
                              </div>
                              {inv === "approve" && (
                                <Badge variant="default" className="shrink-0">
                                  <Check className="h-3 w-3" /> Must approve
                                </Badge>
                              )}
                              {inv === "see" && (
                                <Badge className="shrink-0 border-transparent bg-sky-400/15 text-sky-300">
                                  <Eye className="h-3 w-3" /> Can see
                                </Badge>
                              )}
                              {inv === "off" && (
                                <Badge variant="neutral" className="shrink-0">
                                  Not involved
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Tap a person to switch: Not involved → Can see → Must approve.{" "}
                        {approverCount > 0
                          ? approverCount + " must approve."
                          : "No approval needed — it will be recorded for the record."}
                      </p>
                    </>
                  )}
                </DraftField>

                {/* Evidence: drag & drop or browse */}
                <DraftField label="Evidence" icon={<UploadCloud className="h-3.5 w-3.5" />}>
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
                    }}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                      dragOver
                        ? "border-primary/60 bg-primary/[0.08]"
                        : "border-border/80 bg-white/[0.01] hover:border-white/20"
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    />
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <UploadCloud className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-sm text-foreground/90">
                      {uploading ? "Uploading…" : "Drag photos or files here, or tap to browse"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Photos, PDFs, voice memos — up to 25 MB each
                    </span>
                  </label>

                  {evidence.length > 0 && (
                    <div className="mt-2 grid gap-1.5">
                      {evidence.map((e, i) => {
                        const Icon = evidenceIcon[e.kind];
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-white/[0.015] px-3 py-2 text-sm"
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <span className="min-w-0 flex-1 truncate text-foreground/90">
                              {e.label}
                            </span>
                            <span className="text-xs text-muted-foreground">{e.meta}</span>
                            <button
                              onClick={() =>
                                setEvidence((prev) => prev.filter((_, idx) => idx !== i))
                              }
                              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </DraftField>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-500/[0.08] px-3 py-2 text-xs text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" /> {error}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 p-6 pt-4">
                <Button variant="ghost" onClick={onClose} disabled={stage === "saving"}>
                  Cancel
                </Button>
                <Button variant="secondary" onClick={() => setStage("input")} disabled={stage === "saving"}>
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={record}
                  disabled={stage === "saving" || !title.trim() || !summary.trim()}
                >
                  {stage === "saving" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {stage === "saving" ? "Recording…" : "Record Decision"}
                </Button>
              </div>
            </Step>
          )}

          {stage === "recorded" && recorded && (
            <Step key="recorded">
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400"
                >
                  <Check className="h-8 w-8" strokeWidth={2.5} />
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground">Decision recorded</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Saved permanently — traceable and impossible to lose.
                </p>

                <div className="mt-6 w-full rounded-xl border border-border/70 bg-white/[0.02] p-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Decision ID</span>
                    <span className="font-mono text-sm text-primary">{recorded.id}</span>
                  </div>

                  {recorded.notifications.length > 0 && (
                    <div className="mt-3 border-t border-border/60 pt-3">
                      <div className="mb-2 text-xs text-muted-foreground">Notifications</div>
                      <div className="space-y-1.5">
                        {recorded.notifications.map((n) => (
                          <div key={n.id} className="flex items-center gap-2 text-sm">
                            {n.channel === "email" ? (
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="min-w-0 flex-1 truncate text-foreground/90">
                              {n.userName}
                              <span className="text-muted-foreground">
                                {" "}
                                · {n.kind === "approval" ? "approval request" : "FYI"}
                              </span>
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
                        ))}
                      </div>
                      {recorded.notifications.some((n) => n.status === "demo") && (
                        <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
                          Demo mode — connect email in Settings to send for real. Use the links
                          below to test approvals now.
                        </p>
                      )}
                    </div>
                  )}

                  {recorded.approvals.length > 0 && (
                    <div className="mt-3 border-t border-border/60 pt-3">
                      <div className="mb-2 text-xs text-muted-foreground">Approval links</div>
                      <div className="space-y-1.5">
                        {recorded.approvals.map((a) => (
                          <a
                            key={a.id}
                            href={"/approve/" + a.token}
                            target="_blank"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {a.name} — open approval page
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button size="lg" className="mt-6 w-full" onClick={onClose}>
                  Done
                </Button>
              </div>
            </Step>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-border/60 p-6 pb-5">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function DraftField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground/70">
        {icon}
        <SectionLabel>{label}</SectionLabel>
      </div>
      {children}
    </div>
  );
}

function VoiceBars() {
  return (
    <div className="ml-auto flex items-end gap-0.5">
      {[0.4, 0.9, 0.6, 1, 0.5, 0.8].map((h, i) => (
        <motion.span
          key={i}
          className="w-0.5 rounded-full bg-primary"
          animate={{ height: [h * 6 + "px", h * 16 + "px", h * 6 + "px"] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.08 }}
        />
      ))}
    </div>
  );
}

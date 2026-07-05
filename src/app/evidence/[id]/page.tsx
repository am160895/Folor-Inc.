"use client";

import { useEffect, useState } from "react";
import { Printer, Loader2, Award } from "lucide-react";
import type { Decision } from "@/lib/types";

interface Pkg {
  decision: Decision;
  hash: string;
  workspace: string;
  plan?: "trial" | "pro";
  generatedAt: string;
}

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
      })
    : "—";

export default function EvidencePage({ params }: { params: { id: string } }) {
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/decisions/${params.id}/package`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Not found");
        setPkg(j);
        fetch(`/api/decisions/${params.id}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "evidence_generated", detail: "Evidence package viewed" }),
        });
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  function exportPdf() {
    fetch(`/api/decisions/${params.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pdf_exported", detail: "Evidence package exported to PDF" }),
    });
    window.print();
  }

  if (error) return <Center>{error}</Center>;
  if (!pkg)
    return (
      <Center>
        <Loader2 className="h-5 w-5 animate-spin" /> Building evidence package…
      </Center>
    );

  const d = pkg.decision;
  const acks = d.approvals;

  return (
    <div className="min-h-screen bg-background px-4 py-8 print:bg-white print:p-0">
      {/* Toolbar (hidden in print) */}
      <div className="mx-auto mb-5 flex max-w-3xl items-center justify-between print:hidden">
        <div className="text-sm text-muted-foreground">
          Evidence package · <span className="font-mono text-primary">{d.id}</span>
        </div>
        <div className="flex gap-2">
          <a
            href={`/certificate/${d.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-foreground hover:border-primary/40"
          >
            <Award className="h-4 w-4" /> Audit certificate
          </a>
          <button
            onClick={exportPdf}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
          >
            <Printer className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Paper sheet */}
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-8 text-neutral-900 shadow-2xl print:max-w-none print:rounded-none print:p-6 print:shadow-none sm:p-10">
        {pkg.plan !== "pro" && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="rotate-[-28deg] text-[90px] font-black tracking-[0.3em] text-neutral-900/[0.06] print:text-neutral-900/[0.08]">
              TRIAL
            </span>
          </div>
        )}
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-4">
          <div>
            <div className="text-2xl font-bold tracking-tight">Ledger</div>
            <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Decision Evidence Package
            </div>
          </div>
          <div className="text-right text-xs text-neutral-500">
            <div className="font-mono text-sm font-semibold text-neutral-900">{d.id}</div>
            <div>{pkg.workspace}</div>
            <div>Generated {fmt(pkg.generatedAt)}</div>
          </div>
        </div>

        {/* What was decided */}
        <Section title="1 · Decision">
          <h1 className="text-xl font-bold">{d.title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed">{d.summary}</p>
          <Grid>
            <Cell k="Recorded by" v={d.recordedBy} />
            <Cell k="Date & time" v={`${d.dateLabel}, ${d.timeLabel}`} />
            <Cell k="Location" v={d.location || "—"} />
            <Cell k="Project" v={d.projectName} />
            <Cell k="Cost impact" v={d.costImpact ?? "None recorded"} />
            <Cell k="Schedule impact" v={d.scheduleImpact ?? "None recorded"} />
          </Grid>
          {d.reason && (
            <p className="mt-3 text-sm">
              <span className="font-semibold">Why: </span>
              {d.reason}
            </p>
          )}
          {(d.causedBy || d.origin) && (
            <p className="mt-1.5 text-sm">
              <span className="font-semibold">Origin: </span>
              {d.causedBy ? `Earlier decision ${d.causedBy.id} — ${d.causedBy.title}` : d.origin}
            </p>
          )}
        </Section>

        {/* Acknowledgements */}
        <Section title={`2 · Acknowledgements (${acks.length})`}>
          {acks.length === 0 && (
            <p className="text-sm text-neutral-500">No acknowledgements were requested.</p>
          )}
          {acks.map((a) => (
            <div key={a.id} className="mt-3 break-inside-avoid rounded-lg border border-neutral-300 p-4 first:mt-0">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {a.name}
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    {a.ackRole ?? a.role}
                    {a.ackCompany ? ` · ${a.ackCompany}` : ""}
                    {a.ackEmail ? ` · ${a.ackEmail}` : ""}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    a.status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : a.status === "declined"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {a.status === "approved" ? "ACKNOWLEDGED" : a.status.toUpperCase()}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-neutral-600 sm:grid-cols-3">
                <div>Sent: {fmt(d.notifications.find((n) => n.userName === a.name)?.createdAt ?? null)}</div>
                <div>Opened: {fmt(a.viewedAt)}</div>
                <div>Responded: {fmt(a.respondedAt)}</div>
                {a.ip && <div>IP: {a.ip}</div>}
                {a.device && <div>Device: {a.device}</div>}
              </div>
              {a.buttonText && (
                <p className="mt-2 text-xs italic text-neutral-600">
                  Clicked: “{a.buttonText}”
                </p>
              )}
              {a.snapshot && (
                <div className="mt-2 rounded bg-neutral-100 p-2.5 text-xs text-neutral-600">
                  <span className="font-semibold not-italic">Record as seen at response: </span>
                  “{a.snapshot.title}” — {a.snapshot.summary}{" "}
                  ({a.snapshot.costImpact ?? "no cost"}, {a.snapshot.scheduleImpact ?? "no schedule"})
                </div>
              )}
            </div>
          ))}
        </Section>

        {/* Evidence */}
        <Section title={`3 · Supporting evidence (${d.evidence.length})`}>
          {d.evidence.length === 0 && (
            <p className="text-sm text-neutral-500">No files attached.</p>
          )}
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {d.evidence.map((e, i) => (
              <li key={i}>
                <span className="capitalize">{e.kind}</span> — {e.label}
                {e.meta ? ` (${e.meta})` : ""}
                {e.file && (
                  <a href={`/api/files/${e.file}`} className="ml-1.5 text-blue-700 underline print:no-underline" target="_blank">
                    [file]
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Section>

        {/* Audit trail */}
        <Section title={`4 · Audit trail (${d.events.length} events, append-only)`}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-300 text-neutral-500">
                <th className="py-1 pr-3 font-medium">When</th>
                <th className="py-1 pr-3 font-medium">Event</th>
                <th className="py-1 pr-3 font-medium">Who</th>
                <th className="py-1 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {d.events.map((ev) => (
                <tr key={ev.id} className="border-b border-neutral-100">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{fmt(ev.at)}</td>
                  <td className="py-1.5 pr-3 font-semibold uppercase tracking-wide">
                    {ev.type.replace("_", " ")}
                  </td>
                  <td className="py-1.5 pr-3">{ev.actor}</td>
                  <td className="py-1.5 text-neutral-600">{ev.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Reference + disclaimer */}
        <div className="mt-8 border-t-2 border-neutral-900 pt-4 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Reference ID (SHA-256): <span className="font-mono">{pkg.hash.slice(0, 32)}…</span>
            </span>
            <span>Ledger · {pkg.workspace}</span>
          </div>
          <p className="mt-3 leading-relaxed">
            Ledger creates contemporaneous evidence trails that help teams reconstruct, support,
            and explain decisions. This package is a project record; it does not by itself
            guarantee payment, prove legal entitlement, or replace signed change orders.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 break-inside-avoid">
      <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">{children}</div>;
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-neutral-400">{k}</div>
      <div className="text-sm font-medium">{v}</div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

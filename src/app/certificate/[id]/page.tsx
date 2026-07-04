"use client";

import { useEffect, useState } from "react";
import { Printer, Loader2 } from "lucide-react";
import type { Decision } from "@/lib/types";

interface Pkg { decision: Decision; hash: string; workspace: string; generatedAt: string }

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export default function CertificatePage({ params }: { params: { id: string } }) {
  const [pkg, setPkg] = useState<Pkg | null>(null);

  useEffect(() => {
    fetch(`/api/decisions/${params.id}/package`).then(async (r) => r.ok && setPkg(await r.json()));
  }, [params.id]);

  function exportPdf() {
    fetch(`/api/decisions/${params.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pdf_exported", detail: "Audit certificate exported to PDF" }),
    });
    window.print();
  }

  if (!pkg)
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Preparing certificate…
      </div>
    );

  const d = pkg.decision;
  const acked = d.approvals.filter((a) => a.status === "approved");

  return (
    <div className="min-h-screen bg-background px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-2xl justify-end print:hidden">
        <button
          onClick={exportPdf}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
        >
          <Printer className="h-4 w-4" /> Export PDF
        </button>
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl border-4 border-double border-neutral-800 bg-white p-8 text-neutral-900 shadow-2xl print:rounded-none print:shadow-none sm:p-10">
        <div className="text-center">
          <div className="text-2xl font-bold tracking-tight">Ledger</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.3em] text-neutral-500">
            Certificate of Decision Record
          </div>
          <div className="mx-auto mt-4 h-px w-24 bg-neutral-800" />
        </div>

        <p className="mt-6 text-center text-sm leading-relaxed">
          This certifies that the decision identified below was recorded in Ledger and that the
          acknowledgements listed were captured with the language, timestamps, and metadata shown
          in the accompanying evidence package.
        </p>

        <div className="mt-6 rounded-lg bg-neutral-100 p-4 text-center">
          <div className="font-mono text-sm font-semibold">{d.id}</div>
          <div className="mt-1 text-lg font-bold">{d.title}</div>
          <div className="mt-0.5 text-xs text-neutral-500">
            {d.projectName} · {d.location || "—"} · Recorded {d.dateLabel}, {d.timeLabel} by {d.recordedBy}
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <tbody>
            <Row k="Parties" v={d.approvals.map((a) => `${a.name} (${a.ackRole ?? a.role})`).join("; ") || "—"} />
            <Row k="Acknowledged by" v={acked.map((a) => `${a.name} — ${fmt(a.respondedAt)}`).join("; ") || "None yet"} />
            <Row
              k="Acknowledgement language"
              v={acked[0]?.buttonText ?? "I acknowledge this accurately reflects the decision."}
            />
            <Row k="Evidence on file" v={d.evidence.map((e) => e.label).join("; ") || "None"} />
            <Row k="Audit events" v={`${d.events.length} append-only events from ${fmt(d.events[0]?.at ?? null)} to ${fmt(d.events[d.events.length - 1]?.at ?? null)}`} />
            <Row k="Reference (SHA-256)" v={pkg.hash} mono />
            <Row k="Certificate generated" v={`${fmt(pkg.generatedAt)} · ${pkg.workspace}`} />
          </tbody>
        </table>

        <p className="mt-6 text-center text-[10px] leading-relaxed text-neutral-500">
          Ledger creates contemporaneous evidence trails that help teams reconstruct, support, and
          explain decisions. This certificate is a project record; it does not guarantee payment,
          prove legal entitlement, or replace signed change orders.
        </p>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <tr className="border-b border-neutral-200 align-top">
      <td className="w-44 py-2 pr-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {k}
      </td>
      <td className={`py-2 text-sm ${mono ? "break-all font-mono text-xs" : ""}`}>{v}</td>
    </tr>
  );
}

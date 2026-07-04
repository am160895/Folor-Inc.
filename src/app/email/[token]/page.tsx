"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { LedgerMark } from "@/components/shared";

export default function EmailPreviewPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/approvals/${params.token}`).then(async (r) => r.ok && setData(await r.json()));
  }, [params.token]);

  if (!data)
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading preview…
      </div>
    );

  const d = data.decision;
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <LedgerMark size={20} /> Acknowledgement email — preview of what {data.approverName} receives
        </div>
        {/* Email chrome */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white text-neutral-900 shadow-2xl">
          <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-xs text-neutral-500">
            <div><span className="font-semibold text-neutral-700">From:</span> Folor Ledger &lt;decisions@ledger&gt;</div>
            <div><span className="font-semibold text-neutral-700">To:</span> {data.approverName}</div>
            <div><span className="font-semibold text-neutral-700">Subject:</span> Decision to acknowledge: {d.title}</div>
          </div>
          <div className="p-6">
            <p className="text-xs text-neutral-500">Folor · Ledger</p>
            <h2 className="mt-2 text-lg font-bold">A decision needs your acknowledgement</h2>
            <div className="mt-3 rounded-xl border border-neutral-200 p-4">
              <p className="font-semibold">{d.title}</p>
              <p className="mt-1 text-sm text-neutral-600">{d.summary}</p>
              <p className="mt-2 text-xs text-neutral-500">
                {d.projectName} · {d.location || "—"}<br />
                Recorded by {d.recordedBy} · {d.dateLabel}, {d.timeLabel}<br />
                {d.costImpact ?? "No cost impact"} · {d.scheduleImpact ?? "No schedule impact"}
              </p>
            </div>
            <a
              href={`/approve/${params.token}`}
              className="mt-4 inline-block rounded-xl bg-[#6d4aff] px-5 py-3 text-sm font-semibold text-white"
            >
              Review &amp; acknowledge
            </a>
            <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">{data.consentText}</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <a href={`/approve/${params.token}`} className="text-sm text-primary hover:underline">
            Open the live acknowledgement page →
          </a>
        </div>
      </div>
    </div>
  );
}

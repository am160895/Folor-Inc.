"use client";

import {
  Mic,
  Camera,
  FileText,
  CheckCircle2,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Decision, EvidenceKind, Person } from "@/lib/types";

export const evidenceIcon: Record<EvidenceKind, LucideIcon> = {
  voice: Mic,
  photo: Camera,
  document: FileText,
  acknowledgement: CheckCircle2,
  email: Mail,
};

export function Avatar({
  person,
  className,
}: {
  person: Person;
  className?: string;
}) {
  return (
    <div
      title={`${person.name} · ${person.role}`}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-primary/10 text-[11px] font-semibold text-foreground ring-2 ring-background",
        className
      )}
    >
      {person.initials}
    </div>
  );
}

export function AvatarStack({ people }: { people: Person[] }) {
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {people.slice(0, 4).map((p) => (
          <Avatar key={p.name} person={p} />
        ))}
      </div>
      {people.length > 4 && (
        <span className="ml-2 text-xs text-muted-foreground">
          +{people.length - 4}
        </span>
      )}
    </div>
  );
}

export function StatusPill({ status }: { status: Decision["status"] }) {
  if (status === "Acknowledged") {
    return (
      <Badge variant="success">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Acknowledged
      </Badge>
    );
  }
  if (status === "Pending") {
    return (
      <Badge variant="warning">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Awaiting approval
      </Badge>
    );
  }
  if (status === "Declined") {
    return (
      <Badge className="border-transparent bg-red-500/12 text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        Declined
      </Badge>
    );
  }
  return (
    <Badge variant="muted">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      Recorded
    </Badge>
  );
}

export function ImpactPill({ decision }: { decision: Decision }) {
  const cost = !!decision.costImpact;
  const schedule = !!decision.scheduleImpact;
  if (!cost && !schedule) {
    return <Badge variant="muted">No cost / No schedule</Badge>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={cost ? "warning" : "muted"}>
        {cost ? `Cost ${decision.costImpact}` : "No cost"}
      </Badge>
      <Badge variant={schedule ? "warning" : "muted"}>
        {schedule ? `Schedule ${decision.scheduleImpact}` : "No schedule"}
      </Badge>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
      {children}
    </div>
  );
}


/** Ledger logomark: three bars with a folded page corner, purple gradient. */
export function LedgerMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Ledger">
      <defs>
        <linearGradient id="lg-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d4aff" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#lg-grad)" />
      <rect x="7" y="8" width="18" height="3.4" rx="1.7" fill="white" />
      <rect x="7" y="14.3" width="18" height="3.4" rx="1.7" fill="white" />
      <rect x="7" y="20.6" width="12.5" height="3.4" rx="1.7" fill="white" />
      <path d="M25 20.6 L25 24 L21.5 24 Z" fill="white" opacity="0.85" />
    </svg>
  );
}

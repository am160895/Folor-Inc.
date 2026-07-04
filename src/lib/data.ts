// Client-side helpers: mock-AI search + draft structuring over live data.
// All persistence lives in src/lib/db.ts (SQLite) behind the API routes.

import type { Decision, User } from "./types";

export type {
  Decision,
  User,
  Project,
  Person,
  Evidence,
  EvidenceKind,
  DecisionStatus,
  ApprovalInfo,
  NotificationInfo,
  Bootstrap,
  ConfigStatus,
} from "./types";

export const CURRENT_USER = {
  name: "Folor Admin",
  role: "Administrator",
  initials: "FA",
  company: "Folor Inc.",
};

export function impactLabel(d: Decision): string {
  return [d.costImpact ? "Cost impact" : "No cost", d.scheduleImpact ? "Schedule impact" : "No schedule"].join(
    " / "
  );
}

// --- search -----------------------------------------------------------------

export interface SearchResult {
  answer: string;
  decisions: Decision[];
}

export const EXAMPLE_SEARCHES = [
  "Show decisions with no cost impact",
  "Show decisions waiting for approval",
  "Show decisions involving the architect",
  "What was decided in the lobby?",
];

export function runSearch(query: string, all: Decision[]): SearchResult {
  const q = query.toLowerCase().trim();
  if (!q) return { answer: "", decisions: all };

  const has = (...terms: string[]) => terms.some((t) => q.includes(t));
  let matched = all;
  let answer = "";

  if (has("no cost", "without cost")) {
    matched = all.filter((d) => !d.costImpact);
    answer = `${matched.length} decision${matched.length === 1 ? "" : "s"} recorded with no cost impact.`;
  } else if (has("waiting", "pending", "unacknowledged", "without acknowledgement", "not acknowledged", "no approval")) {
    matched = all.filter((d) => d.status === "Pending");
    answer = `${matched.length} decision${matched.length === 1 ? " is" : "s are"} still waiting for approval.`;
  } else if (has("declined", "rejected")) {
    matched = all.filter((d) => d.status === "Declined");
    answer = `${matched.length} decision${matched.length === 1 ? " was" : "s were"} declined.`;
  } else if (has("architect", "client", "owner", "engineer", "electric", "subcontractor")) {
    const role = ["architect", "client", "owner", "engineer", "electric", "subcontractor"].find((r) =>
      q.includes(r)
    )!;
    matched = all.filter((d) => d.people.some((p) => p.role.toLowerCase().includes(role)));
    answer = `${matched.length} decision${matched.length === 1 ? "" : "s"} involve the ${role}.`;
  } else {
    // Try people first names, then free text across fields.
    const names = new Set<string>();
    all.forEach((d) => d.people.forEach((p) => names.add(p.name.split(" ")[0].toLowerCase())));
    const nameHit = Array.from(names).find((n) => n.length > 2 && q.includes(n));
    if (nameHit) {
      matched = all.filter((d) =>
        d.people.some((p) => p.name.toLowerCase().startsWith(nameHit))
      );
      answer = `${matched.length} decision${matched.length === 1 ? "" : "s"} involve ${
        nameHit[0].toUpperCase() + nameHit.slice(1)
      }.`;
    } else {
      const words = q.replace(/[?.,!]/g, "").split(/\s+/).filter((w) => w.length > 3);
      matched = all.filter((d) => {
        const hay = `${d.title} ${d.summary} ${d.reason} ${d.location} ${d.projectName}`.toLowerCase();
        return words.some((w) => hay.includes(w));
      });
      answer = matched.length
        ? `Found ${matched.length} decision${matched.length === 1 ? "" : "s"} matching "${query}".`
        : `No decisions matched "${query}". Try asking about people, roles, locations, or impact.`;
    }
  }

  return { answer, decisions: matched };
}

// --- draft structuring for the capture flow ---------------------------------

export interface Draft {
  title: string;
  decision: string;
  reason: string;
  location: string;
  costImpact: string | null;
  scheduleImpact: string | null;
  matchedUserIds: number[];
}

export function draftFromText(text: string, users: User[]): Draft {
  const clean = text.trim().replace(/\s+/g, " ");
  const lower = clean.toLowerCase();

  // People: match known users by first name.
  const matchedUserIds = users
    .filter((u) => {
      const first = u.name.split(" ")[0].toLowerCase();
      return first.length > 2 && lower.includes(first);
    })
    .map((u) => u.id);

  const title = makeTitle(clean);

  // Location: "at/in/on the <place>"
  const loc = clean.match(/\b(?:at|in|on)\s+the\s+([A-Za-z][\w\s-]{2,28}?)(?=[,.]|$| instead| rather)/i);

  // Cost impact
  let costImpact: string | null = null;
  const dollar = clean.match(/\$\s?[\d,]+(?:\.\d+)?/);
  if (dollar) costImpact = `${/credit|save|deduct/i.test(clean) ? "-" : "+"}${dollar[0].replace(/\s/, "")}`;

  // Schedule impact
  let scheduleImpact: string | null = null;
  const days = clean.match(/(\d+)\s*(day|week)s?/i);
  if (days && /delay|add|extra|push|extend/i.test(clean)) {
    scheduleImpact = `+${days[1]} ${days[2].toLowerCase()}${parseInt(days[1]) > 1 ? "s" : ""}`;
  }

  // Reason: "because/since ..."
  const why = clean.match(/\b(?:because|since|as)\s+(.{10,140}?)(?=[.!?]|$)/i);

  return {
    title,
    decision: clean,
    reason: why ? why[1].trim() : "",
    location: loc ? loc[1].trim() : "",
    costImpact,
    scheduleImpact,
    matchedUserIds,
  };
}

// --- AI clean-up (deterministic mock) ---------------------------------------

const FILLER =
  /\b(um+|uh+|erm+|like,|you know,?|basically|actually|honestly|obviously|kind of|sort of|i think|i guess|so yeah,?|okay so|right so)\b/gi;

export function tidyText(input: string, opts?: { title?: boolean }): string {
  let t = input.trim().replace(/\s+/g, " ");
  t = t.replace(FILLER, "");
  t = t.replace(/\b(to|and|we|gonna|going to)\s+like\s+/gi, "$1 ");
  for (let i = 0; i < 4; i++) {
    t = t.replace(/^\s*(so|and|but|well|ok|okay|like|yeah|right|um+|uh+)[,\s]+/i, "");
  }
  t = t.replace(/\b(we|they|i)\s+(have\s+)?(agreed|decided|confirmed)\s+(onsite\s+)?(to\s+)?/gi, "");
  t = t.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
  if (!t) return input.trim();
  t = t[0].toUpperCase() + t.slice(1);
  if (opts?.title) {
    return makeTitle(t);
  } else if (!/[.!?]$/.test(t)) {
    t += ".";
  }
  return t;
}


/**
 * Compress a decision statement into a short, headline-style title:
 * "Replace the new water filter with a tap" -> "Replace water filter with tap".
 * Strips boilerplate, the reason clause, and articles; caps at 8 words.
 */
export function makeTitle(text: string): string {
  let t = text.trim().replace(/\s+/g, " ");
  // First sentence only, and drop any trailing reason clause.
  t = t.split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, "");
  t = t.replace(/\b(?:because|since|as|so that|due to)\b.*$/i, "");
  // Strip agreement boilerplate and names before the verb.
  t = t.replace(/^.*?\b(?:agreed|decided|confirmed|want(?:s)? to|going to|gonna)\b\s*(?:onsite\s*)?(?:to\s*)?/i, "");
  t = t.replace(/^(?:we|they|i)\s+(?:will|would|should|need to|are going to)\s*/i, "");
  // Drop articles and softeners to compress.
  t = t.replace(/\b(the|a|an|just|really|new)\b\s*/gi, "");
  t = t.replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim().replace(/[,.]$/, "");
  if (!t) t = text.trim().slice(0, 60);
  // Cap at 8 words.
  const words = t.split(" ");
  if (words.length > 8) t = words.slice(0, 8).join(" ");
  t = t[0].toUpperCase() + t.slice(1);
  return t;
}

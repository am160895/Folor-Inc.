import path from "path";
import fs from "fs";
import crypto from "crypto";
import type {
  Decision,
  User,
  Project,
  ApprovalInfo,
  NotificationInfo,
  Evidence,
  DecisionStatus,
  DecisionRef,
} from "./types";

// ---------------------------------------------------------------------------
// File-backed database (pure JavaScript — no native modules). Everything is
// persisted to data/decisiongraph.json with atomic writes; uploaded evidence
// files live in data/uploads/.
// ---------------------------------------------------------------------------

interface StoredUser {
  id: number;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  notifyEmail: boolean;
  notifySms: boolean;
  createdAt: string;
}

interface StoredProject {
  id: number;
  name: string;
  memberIds: number[];
  createdAt: string;
}

interface StoredDecision {
  id: string;
  title: string;
  summary: string;
  reason: string;
  location: string;
  projectId: number | null;
  recordedBy: string;
  costImpact: string | null;
  scheduleImpact: string | null;
  isExample: boolean;
  createdAt: string;
  /** Visibility-only people. */
  watcherIds: number[];
  /** The decision that caused this one. */
  causedById: string | null;
  evidence: Evidence[];
}

interface StoredApproval {
  id: number;
  decisionId: string;
  userId: number;
  name: string;
  role: string;
  token: string;
  status: "pending" | "approved" | "declined";
  respondedAt: string | null;
}

interface StoredNotification {
  id: number;
  decisionId: string;
  userId: number | null;
  userName: string;
  channel: "email" | "sms";
  kind: "approval" | "fyi";
  destination: string;
  message: string;
  status: "sent" | "demo" | "failed";
  detail: string | null;
  createdAt: string;
}

interface Store {
  nextDecisionNumber: number;
  nextIds: { user: number; project: number; approval: number; notification: number };
  users: StoredUser[];
  projects: StoredProject[];
  decisions: StoredDecision[];
  approvals: StoredApproval[];
  notifications: StoredNotification[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "decisiongraph.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

function seedStore(): Store {
  const now = new Date().toISOString();
  return {
    nextDecisionNumber: 1001,
    nextIds: { user: 1, project: 2, approval: 1, notification: 1 },
    users: [],
    projects: [{ id: 1, name: "Example Project", memberIds: [], createdAt: now }],
    decisions: [
      {
        id: "DG-1000",
        title: "Example — Center lobby lights on soffit",
        summary:
          "Linear lights are to be centered on the soffit, not aligned to the ceiling grid.",
        reason:
          "Architectural alignment looked cleaner onsite. The soffit is the dominant visual line entering the lobby.",
        location: "Lobby soffit",
        projectId: 1,
        recordedBy: "Folor Admin",
        costImpact: null,
        scheduleImpact: null,
        isExample: true,
        createdAt: now,
        watcherIds: [],
        causedById: null,
        evidence: [
          { kind: "voice", label: "Voice note", meta: "0:38 · onsite" },
          { kind: "photo", label: "Site photo", meta: "Lobby soffit, east" },
        ],
      },
    ],
    approvals: [],
    notifications: [],
  };
}

/** Fill in fields added after older data files were written. */
function normalize(s: Store): Store {
  s.projects.forEach((p) => {
    if (!Array.isArray(p.memberIds)) p.memberIds = [];
  });
  s.decisions.forEach((d: any) => {
    if (!Array.isArray(d.watcherIds)) d.watcherIds = Array.isArray(d.personIds) ? d.personIds : [];
    if (d.causedById === undefined) d.causedById = null;
    if (!Array.isArray(d.evidence)) d.evidence = [];
  });
  s.notifications.forEach((n: any) => {
    if (!n.kind) n.kind = "approval";
  });
  return s;
}

function load(): Store {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DATA_FILE)) {
    try {
      return normalize(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as Store);
    } catch {
      fs.renameSync(DATA_FILE, DATA_FILE + ".corrupt-" + Date.now());
    }
  }
  const store = seedStore();
  persist(store);
  return store;
}

function persist(store: Store) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}

const g = globalThis as unknown as { __dgstore?: Store };
function db(): Store {
  if (!g.__dgstore) g.__dgstore = load();
  return g.__dgstore;
}

function save() {
  persist(db());
}

export function newToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    email: u.email,
    phone: u.phone,
    notifyEmail: u.notifyEmail,
    notifySms: u.notifySms,
    initials: initialsOf(u.name),
  };
}

function statusOf(approvals: ApprovalInfo[]): DecisionStatus {
  if (approvals.length === 0) return "Recorded";
  if (approvals.some((a) => a.status === "declined")) return "Declined";
  if (approvals.every((a) => a.status === "approved")) return "Acknowledged";
  return "Pending";
}

function usersByIds(ids: number[]): User[] {
  const s = db();
  return ids
    .map((id) => s.users.find((u) => u.id === id))
    .filter((u): u is StoredUser => !!u)
    .map(mapUser);
}

function mapDecision(d: StoredDecision): Decision {
  const s = db();

  const approvals: ApprovalInfo[] = s.approvals
    .filter((a) => a.decisionId === d.id)
    .map((a) => ({
      id: a.id,
      userId: a.userId,
      name: a.name,
      role: a.role,
      initials: initialsOf(a.name),
      status: a.status,
      token: a.token,
      respondedAt: a.respondedAt,
    }));

  const watchers = usersByIds(d.watcherIds.filter((id) => !approvals.some((a) => a.userId === id)));
  const approverPeople = usersByIds(approvals.map((a) => a.userId));
  const people = [...approverPeople, ...watchers];

  const notifications: NotificationInfo[] = s.notifications
    .filter((n) => n.decisionId === d.id)
    .map((n) => ({
      id: n.id,
      userName: n.userName,
      channel: n.channel,
      kind: n.kind,
      destination: n.destination,
      status: n.status,
      createdAt: n.createdAt,
    }));

  const project = d.projectId ? s.projects.find((p) => p.id === d.projectId) : undefined;
  const date = new Date(d.createdAt);
  const status = statusOf(approvals);
  const roles = Array.from(new Set(["Folor", ...people.map((p) => p.role)]));

  const causedByStored = d.causedById
    ? s.decisions.find((x) => x.id === d.causedById)
    : undefined;
  const causedBy: DecisionRef | null = causedByStored
    ? { id: causedByStored.id, title: causedByStored.title }
    : null;
  const ledTo: DecisionRef[] = s.decisions
    .filter((x) => x.causedById === d.id)
    .map((x) => ({ id: x.id, title: x.title }));

  let confidence = 70;
  if (d.reason) confidence += 10;
  confidence += Math.min(d.evidence.length, 2) * 5;
  if (status === "Acknowledged") confidence += 10;

  return {
    id: d.id,
    title: d.title,
    summary: d.summary,
    reason: d.reason,
    location: d.location,
    projectId: d.projectId,
    projectName: project?.name ?? "—",
    recordedBy: d.recordedBy,
    createdAt: d.createdAt,
    dateLabel: date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    timeLabel: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    status,
    costImpact: d.costImpact,
    scheduleImpact: d.scheduleImpact,
    people,
    watchers,
    approvals,
    notifications,
    evidence: d.evidence,
    visibleTo: roles,
    causedBy,
    ledTo,
    isExample: d.isExample,
    confidence: Math.min(confidence, 98),
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function listUsers(): User[] {
  return [...db().users].sort((a, b) => a.name.localeCompare(b.name)).map(mapUser);
}

export function createUser(input: {
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  notifyEmail?: boolean;
  notifySms?: boolean;
}): User {
  const s = db();
  const user: StoredUser = {
    id: s.nextIds.user++,
    name: input.name.trim(),
    role: input.role?.trim() || "Team member",
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    notifyEmail: input.notifyEmail !== false,
    notifySms: !!input.notifySms,
    createdAt: new Date().toISOString(),
  };
  s.users.push(user);
  save();
  return mapUser(user);
}

export function deleteUser(id: number): void {
  const s = db();
  s.users = s.users.filter((u) => u.id !== id);
  s.decisions.forEach((d) => {
    d.watcherIds = d.watcherIds.filter((pid) => pid !== id);
  });
  s.projects.forEach((p) => {
    p.memberIds = p.memberIds.filter((pid) => pid !== id);
  });
  save();
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function listProjects(): Project[] {
  const s = db();
  return [...s.projects]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({
      id: p.id,
      name: p.name,
      decisionCount: s.decisions.filter((d) => d.projectId === p.id).length,
      members: usersByIds(p.memberIds),
    }));
}

export function createProject(name: string): Project {
  const s = db();
  const project: StoredProject = {
    id: s.nextIds.project++,
    name: name.trim(),
    memberIds: [],
    createdAt: new Date().toISOString(),
  };
  s.projects.push(project);
  save();
  return { id: project.id, name: project.name, decisionCount: 0, members: [] };
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export function listDecisions(): Decision[] {
  return [...db().decisions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(mapDecision);
}

export function getDecision(id: string): Decision | null {
  const d = db().decisions.find((x) => x.id === id);
  return d ? mapDecision(d) : null;
}

export interface NewDecisionInput {
  title: string;
  summary: string;
  reason?: string;
  location?: string;
  projectId?: number | null;
  newProjectName?: string;
  costImpact?: string | null;
  scheduleImpact?: string | null;
  watcherIds: number[];
  approverIds: number[];
  causedById?: string | null;
  evidence?: Evidence[];
  recordedBy?: string;
}

export function createDecision(input: NewDecisionInput): Decision {
  const s = db();

  let projectId = input.projectId ?? null;
  if (!projectId && input.newProjectName?.trim()) {
    projectId = createProject(input.newProjectName).id;
  }

  const id = "DG-" + s.nextDecisionNumber++;
  const validIds = (ids: number[]) => ids.filter((uid) => s.users.some((u) => u.id === uid));
  const approverIds = Array.from(new Set(validIds(input.approverIds)));
  const watcherIds = Array.from(
    new Set(validIds(input.watcherIds).filter((uid) => !approverIds.includes(uid)))
  );

  const causedById =
    input.causedById && s.decisions.some((d) => d.id === input.causedById)
      ? input.causedById
      : null;

  s.decisions.push({
    id,
    title: input.title.trim(),
    summary: input.summary.trim(),
    reason: input.reason?.trim() ?? "",
    location: input.location?.trim() ?? "",
    projectId,
    recordedBy: input.recordedBy ?? "Folor Admin",
    costImpact: input.costImpact?.trim() || null,
    scheduleImpact: input.scheduleImpact?.trim() || null,
    isExample: false,
    createdAt: new Date().toISOString(),
    watcherIds,
    causedById,
    evidence: input.evidence ?? [],
  });

  approverIds.forEach((uid) => {
    const user = s.users.find((u) => u.id === uid)!;
    s.approvals.push({
      id: s.nextIds.approval++,
      decisionId: id,
      userId: uid,
      name: user.name,
      role: user.role,
      token: newToken(),
      status: "pending",
      respondedAt: null,
    });
  });

  // Everyone on the decision automatically joins the project team.
  if (projectId) {
    const project = s.projects.find((p) => p.id === projectId);
    if (project) {
      project.memberIds = Array.from(
        new Set([...project.memberIds, ...approverIds, ...watcherIds])
      );
    }
  }

  save();
  return getDecision(id)!;
}

export function addEvidence(decisionId: string, evidence: Evidence): Decision | null {
  const s = db();
  const d = s.decisions.find((x) => x.id === decisionId);
  if (!d) return null;
  d.evidence.push(evidence);
  save();
  return getDecision(decisionId);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function recordNotification(n: {
  decisionId: string;
  userId: number | null;
  channel: "email" | "sms";
  kind: "approval" | "fyi";
  destination: string;
  message: string;
  status: "sent" | "demo" | "failed";
  detail?: string;
}) {
  const s = db();
  const user = n.userId ? s.users.find((u) => u.id === n.userId) : undefined;
  s.notifications.push({
    id: s.nextIds.notification++,
    decisionId: n.decisionId,
    userId: n.userId,
    userName: user?.name ?? "",
    channel: n.channel,
    kind: n.kind,
    destination: n.destination,
    message: n.message,
    status: n.status,
    detail: n.detail ?? null,
    createdAt: new Date().toISOString(),
  });
  save();
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export interface ApprovalLookup {
  approvalId: number;
  status: "pending" | "approved" | "declined";
  approverName: string;
  approverRole: string;
  decision: Decision;
}

export function getApprovalByToken(token: string): ApprovalLookup | null {
  const s = db();
  const a = s.approvals.find((x) => x.token === token);
  if (!a) return null;
  const decision = getDecision(a.decisionId);
  if (!decision) return null;
  return {
    approvalId: a.id,
    status: a.status,
    approverName: a.name,
    approverRole: a.role,
    decision,
  };
}

export function respondToApproval(
  token: string,
  action: "approved" | "declined"
): ApprovalLookup | null {
  const s = db();
  const a = s.approvals.find((x) => x.token === token);
  if (!a) return null;
  a.status = action;
  a.respondedAt = new Date().toISOString();
  save();
  return getApprovalByToken(token);
}

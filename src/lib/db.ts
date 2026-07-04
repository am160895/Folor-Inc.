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
  Team,
  WorkspaceSettings,
  AuditEvent,
  AuditEventType,
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
  /** Free-form origin, e.g. "Site visit", "Phone call". */
  origin: string | null;
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
  viewedAt: string | null;
  ackRole: string | null;
  ackCompany: string | null;
  ackEmail: string | null;
  ip: string | null;
  device: string | null;
  userAgent: string | null;
  buttonText: string | null;
  consentText: string | null;
  snapshot: any | null;
}

interface StoredTeam {
  id: number;
  name: string;
  memberIds: number[];
  password: string | null;
  createdAt: string;
}

interface StoredSession {
  token: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
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

interface StoredEvent {
  id: number;
  decisionId: string;
  type: AuditEventType;
  at: string;
  actor: string;
  detail: string;
}

export const CONSENT_TEXT =
  "By clicking acknowledge, you agree this electronic acknowledgement may be used as a project record and evidence of your acknowledgement of the decision described above.";
export const ACK_BUTTON_TEXT = "I acknowledge this accurately reflects the decision.";

interface Store {
  nextDecisionNumber: number;
  nextIds: { user: number; project: number; approval: number; notification: number; team: number; event: number };
  users: StoredUser[];
  projects: StoredProject[];
  decisions: StoredDecision[];
  approvals: StoredApproval[];
  notifications: StoredNotification[];
  teams: StoredTeam[];
  settings: WorkspaceSettings;
  events: StoredEvent[];
  sessions: StoredSession[];
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  workspaceName: "Folor Inc.",
  adminPassword: "ledger123",
  currency: "$",
  autoTeam: true,
  requireReason: false,
  defaultVisibility: "team",
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "decisiongraph.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

function seedStore(): Store {
  const now = new Date().toISOString();
  return {
    nextDecisionNumber: 1001,
    nextIds: { user: 1, project: 2, approval: 1, notification: 1, team: 1, event: 1 },
    users: [],
    projects: [{ id: 1, name: "Example Project", memberIds: [], createdAt: now }],
    decisions: [
      {
        id: "LG-1000",
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
        origin: "Site visit",
        evidence: [
          { kind: "voice", label: "Voice note", meta: "0:38 · onsite" },
          { kind: "photo", label: "Site photo", meta: "Lobby soffit, east" },
        ],
      },
    ],
    approvals: [],
    notifications: [],
    teams: [],
    settings: { ...DEFAULT_SETTINGS },
    events: [],
    sessions: [],
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
    if (d.origin === undefined) d.origin = null;
    if (!Array.isArray(d.evidence)) d.evidence = [];
  });
  s.notifications.forEach((n: any) => {
    if (!n.kind) n.kind = "approval";
  });
  s.approvals.forEach((a: any) => {
    if (a.viewedAt === undefined) a.viewedAt = null;
    ["ackRole","ackCompany","ackEmail","ip","device","userAgent","buttonText","consentText","snapshot"].forEach((k) => {
      if (a[k] === undefined) a[k] = null;
    });
  });
  if (!Array.isArray((s as any).events)) (s as any).events = [];
  if (!(s.nextIds as any).event) (s.nextIds as any).event = 1;
  if (!Array.isArray(s.teams)) s.teams = [];
  s.teams.forEach((t: any) => {
    if (t.password === undefined) t.password = null;
  });
  if (!Array.isArray((s as any).sessions)) (s as any).sessions = [];
  if (!(s.nextIds as any).team) (s.nextIds as any).team = 1;
  s.settings = { ...DEFAULT_SETTINGS, ...(s.settings ?? {}) };
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

/** Append-only audit log. Events are never edited or removed. */
export function logEvent(
  decisionId: string,
  type: AuditEventType,
  actor: string,
  detail: string
) {
  const s = db();
  s.events.push({
    id: s.nextIds.event++,
    decisionId,
    type,
    at: new Date().toISOString(),
    actor,
    detail,
  });
  save();
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
      viewedAt: a.viewedAt,
      ackRole: a.ackRole,
      ackCompany: a.ackCompany,
      ackEmail: a.ackEmail,
      ip: a.ip,
      device: a.device,
      userAgent: a.userAgent,
      buttonText: a.buttonText,
      consentText: a.consentText,
      snapshot: a.snapshot,
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
    origin: d.origin,
    ledTo,
    isExample: d.isExample,
    confidence: Math.min(confidence, 98),
    events: s.events
      .filter((ev) => ev.decisionId === d.id)
      .map((ev) => ({ id: ev.id, type: ev.type, at: ev.at, actor: ev.actor, detail: ev.detail })),
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
  teamId?: number | null;
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
  if (input.teamId) {
    const team = s.teams.find((t) => t.id === input.teamId);
    if (team && !team.memberIds.includes(user.id)) team.memberIds.push(user.id);
  }
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
  origin?: string | null;
  evidence?: Evidence[];
  recordedBy?: string;
}

export function createDecision(input: NewDecisionInput): Decision {
  const s = db();

  let projectId = input.projectId ?? null;
  if (!projectId && input.newProjectName?.trim()) {
    projectId = createProject(input.newProjectName).id;
  }

  const id = "LG-" + s.nextDecisionNumber++;
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
    origin: causedById ? null : input.origin?.trim() || null,
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
      viewedAt: null,
      ackRole: null,
      ackCompany: null,
      ackEmail: null,
      ip: null,
      device: null,
      userAgent: null,
      buttonText: null,
      consentText: null,
      snapshot: null,
    });
  });

  // Everyone on the decision automatically joins the project team.
  if (projectId && db().settings.autoTeam) {
    const project = s.projects.find((p) => p.id === projectId);
    if (project) {
      project.memberIds = Array.from(
        new Set([...project.memberIds, ...approverIds, ...watcherIds])
      );
    }
  }

  save();
  logEvent(id, "created", input.recordedBy ?? "Folor Admin", "Decision recorded" + (projectId ? " on project" : ""));
  return getDecision(id)!;
}

export function addEvidence(decisionId: string, evidence: Evidence): Decision | null {
  const s = db();
  const d = s.decisions.find((x) => x.id === decisionId);
  if (!d) return null;
  d.evidence.push(evidence);
  save();
  logEvent(decisionId, "evidence_added", "Folor Admin", evidence.kind + ": " + evidence.label);
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
  logEvent(
    n.decisionId,
    "sent",
    user?.name ?? n.destination,
    (n.kind === "approval" ? "Acknowledgement request" : "FYI notice") + " sent by " + n.channel + " to " + n.destination + (n.status === "demo" ? " (demo mode)" : "")
  );
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

export interface AckMeta {
  role?: string;
  company?: string;
  ip?: string;
  userAgent?: string;
}

function deviceOf(ua: string | undefined): string | null {
  if (!ua) return null;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Mobile/i.test(ua)) return "Mobile";
  return "Desktop";
}

export function respondToApproval(
  token: string,
  action: "approved" | "declined",
  meta: AckMeta = {}
): ApprovalLookup | null {
  const s = db();
  const a = s.approvals.find((x) => x.token === token);
  if (!a) return null;
  const d = s.decisions.find((x) => x.id === a.decisionId);
  const user = s.users.find((u) => u.id === a.userId);
  a.status = action;
  a.respondedAt = new Date().toISOString();
  a.ackRole = meta.role?.trim() || a.role;
  a.ackCompany = meta.company?.trim() || null;
  a.ackEmail = user?.email ?? null;
  a.ip = meta.ip ?? null;
  a.userAgent = meta.userAgent ?? null;
  a.device = deviceOf(meta.userAgent);
  a.buttonText =
    action === "approved" ? ACK_BUTTON_TEXT : "This does not accurately reflect the decision.";
  a.consentText = CONSENT_TEXT;
  if (d) {
    const date = new Date(d.createdAt);
    a.snapshot = {
      title: d.title,
      summary: d.summary,
      reason: d.reason,
      location: d.location,
      costImpact: d.costImpact,
      scheduleImpact: d.scheduleImpact,
      dateLabel: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    };
  }
  save();
  logEvent(
    a.decisionId,
    action === "approved" ? "acknowledged" : "declined",
    a.name,
    (a.ackRole ?? a.role) + (a.ackCompany ? " · " + a.ackCompany : "") + (a.ip ? " · IP " + a.ip : "")
  );
  return getApprovalByToken(token);
}

/** SHA-256 reference over the decision's full record for the evidence package. */
export function packageHash(id: string): string | null {
  const d = getDecision(id);
  if (!d) return null;
  const canonical = JSON.stringify({
    id: d.id, title: d.title, summary: d.summary, reason: d.reason, location: d.location,
    cost: d.costImpact, schedule: d.scheduleImpact, createdAt: d.createdAt,
    approvals: d.approvals.map((x) => ({ n: x.name, s: x.status, t: x.respondedAt })),
    evidence: d.evidence.map((e) => e.label),
    events: d.events.map((e) => ({ t: e.type, at: e.at })),
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}


// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export function listTeams(): Team[] {
  const s = db();
  return [...s.teams]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ id: t.id, name: t.name, memberIds: t.memberIds, members: usersByIds(t.memberIds), password: t.password }));
}

export function createTeam(name: string, memberIds: number[]): Team {
  const s = db();
  const team: StoredTeam = {
    id: s.nextIds.team++,
    name: name.trim(),
    memberIds: memberIds.filter((id) => s.users.some((u) => u.id === id)),
    password: null,
    createdAt: new Date().toISOString(),
  };
  s.teams.push(team);
  save();
  return { id: team.id, name: team.name, memberIds: team.memberIds, members: usersByIds(team.memberIds), password: null };
}

export function deleteTeam(id: number): void {
  const s = db();
  s.teams = s.teams.filter((t) => t.id !== id);
  save();
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSettings(): WorkspaceSettings {
  return { ...db().settings };
}

export function updateSettings(patch: Partial<WorkspaceSettings>): WorkspaceSettings {
  const s = db();
  s.settings = { ...s.settings, ...patch };
  save();
  return { ...s.settings };
}

/** Read receipt: record the first time an approver opens their link. */
export function markApprovalViewed(token: string): void {
  const s = db();
  const a = s.approvals.find((x) => x.token === token);
  if (a && !a.viewedAt) {
    a.viewedAt = new Date().toISOString();
    save();
    logEvent(a.decisionId, "opened", a.name, "Opened their acknowledgement link");
  }
}


// ---------------------------------------------------------------------------
// Editing
// ---------------------------------------------------------------------------

export function updateUser(
  id: number,
  patch: Partial<Pick<StoredUser, "name" | "role" | "email" | "phone" | "notifyEmail" | "notifySms">>
): User | null {
  const s = db();
  const u = s.users.find((x) => x.id === id);
  if (!u) return null;
  if (patch.name?.trim()) u.name = patch.name.trim();
  if (patch.role?.trim()) u.role = patch.role.trim();
  if (patch.email !== undefined) u.email = patch.email?.trim() || null;
  if (patch.phone !== undefined) u.phone = patch.phone?.trim() || null;
  if (typeof patch.notifyEmail === "boolean") u.notifyEmail = patch.notifyEmail;
  if (typeof patch.notifySms === "boolean") u.notifySms = patch.notifySms;
  // Keep audit snapshots on pending approvals in sync with the person.
  s.approvals.forEach((a) => {
    if (a.userId === id && a.status === "pending") {
      a.name = u.name;
      a.role = u.role;
    }
  });
  save();
  return mapUser(u);
}

export function updateTeam(
  id: number,
  patch: { name?: string; memberIds?: number[]; password?: string | null }
): Team | null {
  const s = db();
  const t = s.teams.find((x) => x.id === id);
  if (!t) return null;
  if (patch.name?.trim()) t.name = patch.name.trim();
  if (Array.isArray(patch.memberIds)) {
    t.memberIds = patch.memberIds.filter((uid) => s.users.some((u) => u.id === uid));
  }
  if (patch.password !== undefined) t.password = patch.password?.trim() || null;
  save();
  return { id: t.id, name: t.name, memberIds: t.memberIds, members: usersByIds(t.memberIds), password: t.password };
}

export function updateDecision(
  id: string,
  patch: Partial<
    Pick<
      StoredDecision,
      "title" | "summary" | "reason" | "location" | "costImpact" | "scheduleImpact" | "origin" | "causedById" | "projectId"
    >
  >
): Decision | null {
  const s = db();
  const d = s.decisions.find((x) => x.id === id);
  if (!d) return null;
  if (patch.title?.trim()) d.title = patch.title.trim();
  if (patch.summary?.trim()) d.summary = patch.summary.trim();
  if (patch.reason !== undefined) d.reason = patch.reason?.trim() ?? "";
  if (patch.location !== undefined) d.location = patch.location?.trim() ?? "";
  if (patch.costImpact !== undefined) d.costImpact = patch.costImpact?.trim() || null;
  if (patch.scheduleImpact !== undefined) d.scheduleImpact = patch.scheduleImpact?.trim() || null;
  if (patch.origin !== undefined) d.origin = patch.origin?.trim() || null;
  if (patch.causedById !== undefined) {
    d.causedById =
      patch.causedById && s.decisions.some((x) => x.id === patch.causedById && x.id !== id)
        ? patch.causedById
        : null;
    if (d.causedById) d.origin = null;
  }
  if (patch.projectId !== undefined) {
    d.projectId = s.projects.some((p) => p.id === patch.projectId) ? patch.projectId : null;
  }
  save();
  logEvent(id, "edited", "Folor Admin", "Fields changed: " + Object.keys(patch).join(", "));
  return getDecision(id);
}


// ---------------------------------------------------------------------------
// Authentication (workspace login)
// ---------------------------------------------------------------------------

export interface SessionInfo {
  token: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

/**
 * Login rules (turnkey, prototype-grade):
 * - email "admin" (or any email) + the workspace admin password -> admin session
 * - a person's email + any of their teams' passwords -> member session
 */
export function login(email: string, password: string): SessionInfo | null {
  const s = db();
  const e = email.trim().toLowerCase();
  if (!e || !password) return null;

  let name = "Workspace Admin";
  let isAdmin = false;

  if (password === s.settings.adminPassword) {
    isAdmin = true;
    const u = s.users.find((x) => x.email?.toLowerCase() === e);
    if (u) name = u.name;
  } else {
    const u = s.users.find((x) => x.email?.toLowerCase() === e);
    if (!u) return null;
    const teamOk = s.teams.some(
      (t) => t.password && t.password === password && t.memberIds.includes(u.id)
    );
    if (!teamOk) return null;
    name = u.name;
  }

  const session: StoredSession = {
    token: newToken(),
    email: e,
    name,
    isAdmin,
    createdAt: new Date().toISOString(),
  };
  s.sessions.push(session);
  // Keep the session list tidy.
  if (s.sessions.length > 200) s.sessions = s.sessions.slice(-100);
  save();
  return { token: session.token, email: session.email, name: session.name, isAdmin };
}

export function getSession(token: string | undefined | null): SessionInfo | null {
  if (!token) return null;
  const t = db().sessions.find((x) => x.token === token);
  return t ? { token: t.token, email: t.email, name: t.name, isAdmin: t.isAdmin } : null;
}

export function logout(token: string | undefined | null): void {
  if (!token) return;
  const s = db();
  s.sessions = s.sessions.filter((x) => x.token !== token);
  save();
}

export function generatePassword(): string {
  const words = ["steel", "brick", "crane", "level", "frame", "beam", "stone", "north", "field", "site"];
  const w = words[crypto.randomBytes(1)[0] % words.length];
  const n = (crypto.randomBytes(2).readUInt16BE(0) % 900) + 100;
  return w + "-" + n + "-" + newToken().slice(0, 4);
}

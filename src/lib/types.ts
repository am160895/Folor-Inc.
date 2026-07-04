// Shared domain types for DecisionGraph (Folor)

export type DecisionStatus = "Recorded" | "Pending" | "Acknowledged" | "Declined";

export type EvidenceKind = "voice" | "photo" | "document" | "acknowledgement" | "email";

export interface Evidence {
  kind: EvidenceKind;
  label: string;
  meta?: string;
  /** Stored filename under data/uploads, when this evidence is a real file. */
  file?: string;
}

export interface Person {
  id?: number;
  name: string;
  role: string;
  initials: string;
}

export interface User {
  id: number;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  notifyEmail: boolean;
  notifySms: boolean;
  /** Personal login password — only sent to admin sessions. */
  password: string | null;
  initials: string;
}

export interface Project {
  id: number;
  name: string;
  decisionCount?: number;
  members: Person[];
}

export interface ApprovalInfo {
  id: number;
  userId: number;
  name: string;
  role: string;
  initials: string;
  status: "pending" | "approved" | "declined";
  token: string;
  respondedAt: string | null;
  /** Read receipt: when the approver first opened their link. */
  viewedAt: string | null;
  /** Signer-confirmed role at acknowledgement (Owner, Architect, ...). */
  ackRole: string | null;
  ackCompany: string | null;
  ackEmail: string | null;
  ip: string | null;
  device: string | null;
  userAgent: string | null;
  /** The exact button language the signer clicked. */
  buttonText: string | null;
  /** The consent language shown at acknowledgement. */
  consentText: string | null;
  /** Frozen copy of what the signer saw when they responded. */
  snapshot: {
    title: string;
    summary: string;
    reason: string;
    location: string;
    costImpact: string | null;
    scheduleImpact: string | null;
    dateLabel: string;
  } | null;
}

export type AuditEventType =
  | "created"
  | "sent"
  | "opened"
  | "acknowledged"
  | "declined"
  | "edited"
  | "evidence_added"
  | "pdf_exported"
  | "evidence_generated";

export interface AuditEvent {
  id: number;
  type: AuditEventType;
  at: string;
  actor: string;
  detail: string;
}

export interface NotificationInfo {
  id: number;
  userName: string;
  channel: "email" | "sms";
  kind: "approval" | "fyi";
  destination: string;
  status: "sent" | "demo" | "failed";
  createdAt: string;
}

export interface DecisionRef {
  id: string;
  title: string;
}

export interface Decision {
  id: string;
  title: string;
  summary: string;
  reason: string;
  location: string;
  projectId: number | null;
  projectName: string;
  recordedBy: string;
  createdAt: string;
  dateLabel: string;
  timeLabel: string;
  status: DecisionStatus;
  costImpact: string | null;
  scheduleImpact: string | null;
  /** Everyone attached to the decision (watchers + approvers). */
  people: Person[];
  /** Visibility-only people (notified FYI, no approval required). */
  watchers: Person[];
  approvals: ApprovalInfo[];
  notifications: NotificationInfo[];
  evidence: Evidence[];
  visibleTo: string[];
  /** The earlier decision that caused this one, if any. */
  causedBy: DecisionRef | null;
  /** How the decision came about when not caused by another decision (e.g. "Site visit"). */
  origin: string | null;
  /** Decisions that list this one as their cause. */
  ledTo: DecisionRef[];
  isExample: boolean;
  confidence: number;
  /** Append-only audit trail. */
  events: AuditEvent[];
}

export interface Team {
  id: number;
  name: string;
  memberIds: number[];
  members: Person[];
  /** Team login password (visible to the admin in Settings). */
  password: string | null;
}

export interface WorkspaceSettings {
  workspaceName: string;
  /** Master admin password for the workspace login. */
  adminPassword: string;
  currency: string;
  autoTeam: boolean;
  requireReason: boolean;
  defaultVisibility: "team" | "none";
}

export interface ConfigStatus {
  emailConfigured: boolean;
  smsConfigured: boolean;
}

export interface Bootstrap {
  me: { name: string; email: string; isAdmin: boolean };
  decisions: Decision[];
  users: User[];
  projects: Project[];
  teams: Team[];
  settings: WorkspaceSettings;
  config: ConfigStatus;
}

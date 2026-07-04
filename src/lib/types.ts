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
  /** Decisions that list this one as their cause. */
  ledTo: DecisionRef[];
  isExample: boolean;
  confidence: number;
}

export interface ConfigStatus {
  emailConfigured: boolean;
  smsConfigured: boolean;
}

export interface Bootstrap {
  decisions: Decision[];
  users: User[];
  projects: Project[];
  config: ConfigStatus;
}

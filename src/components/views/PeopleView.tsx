"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  Trash2,
  Mail,
  MessageSquare,
  Loader2,
  AlertTriangle,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, SectionLabel } from "@/components/shared";
import type { User, Team } from "@/lib/types";

const ROLES = [
  "Architect",
  "Client",
  "Owner",
  "Superintendent",
  "Project Manager",
  "Engineer",
  "Electrical",
  "Plumbing",
  "Subcontractor",
];

export function PeopleView({
  users,
  teams,
  onChanged,
}: {
  users: User[];
  teams: Team[];
  onChanged: () => void;
}) {
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<Set<number>>(new Set());
  const [savingTeam, setSavingTeam] = useState(false);

  async function addTeam() {
    if (!teamName.trim()) return;
    setSavingTeam(true);
    await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName, memberIds: Array.from(teamMembers) }),
    });
    setTeamName("");
    setTeamMembers(new Set());
    setSavingTeam(false);
    onChanged();
  }

  async function removeTeam(id: number) {
    await fetch("/api/teams/" + id, { method: "DELETE" });
    onChanged();
  }
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [customRole, setCustomRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [newUserTeamId, setNewUserTeamId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addUser() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role: role === "custom" ? customRole : role,
          email,
          phone,
          notifyEmail,
          notifySms,
          teamId: newUserTeamId === "" ? null : newUserTeamId,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not add this person.");
      setName("");
      setEmail("");
      setPhone("");
      setCustomRole("");
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(id: number) {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    onChanged();
  }

  // Inline editing of an existing person
  const [editingId, setEditingId] = useState<number | null>(null);
  const [edit, setEdit] = useState({ name: "", role: "", email: "", phone: "", notifyEmail: true, notifySms: false });
  const [savingEdit, setSavingEdit] = useState(false);

  function startEdit(u: User) {
    setEditingId(u.id);
    setEdit({
      name: u.name,
      role: u.role,
      email: u.email ?? "",
      phone: u.phone ?? "",
      notifyEmail: u.notifyEmail,
      notifySms: u.notifySms,
    });
  }

  async function saveUserEdit() {
    if (editingId === null) return;
    setSavingEdit(true);
    await fetch(`/api/users/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    });
    setSavingEdit(false);
    setEditingId(null);
    onChanged();
  }

  // Team editing
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamMembers, setEditTeamMembers] = useState<Set<number>>(new Set());

  function startTeamEdit(t: Team) {
    setEditingTeamId(t.id);
    setEditTeamName(t.name);
    setEditTeamMembers(new Set(t.memberIds));
  }

  async function saveTeamEdit() {
    if (editingTeamId === null) return;
    await fetch(`/api/teams/${editingTeamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editTeamName, memberIds: Array.from(editTeamMembers) }),
    });
    setEditingTeamId(null);
    onChanged();
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="pt-4">
        <h1 className="text-xl font-semibold tracking-tight">People</h1>
        <p className="text-sm text-muted-foreground">
          Everyone here can be added to decisions and asked to approve. Only a name is required —
          add an email or mobile number so they can be notified.
        </p>
      </div>

      {/* Teams */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Teams</h2>
        <p className="text-sm text-muted-foreground">
          Group people (e.g. Design Team, Electrical) and add the whole team to a decision in one tap.
        </p>

        <div className="mt-4 rounded-2xl border border-border/80 bg-card p-5 ring-hairline">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              placeholder="Team name (e.g. Design Team)"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <Button onClick={addTeam} disabled={savingTeam || !teamName.trim()}>
              {savingTeam ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create team
            </Button>
          </div>
          {users.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              You can create the team now and add people to it below.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {users.map((u) => {
                const on = teamMembers.has(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() =>
                      setTeamMembers((prev) => {
                        const next = new Set(prev);
                        next.has(u.id) ? next.delete(u.id) : next.add(u.id);
                        return next;
                      })
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      on
                        ? "border-primary/50 bg-primary/[0.12] text-foreground"
                        : "border-border/70 bg-white/[0.02] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {u.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2.5">
          {teams.map((t) =>
            editingTeamId === t.id ? (
              <div key={t.id} className="space-y-3 rounded-2xl border border-primary/30 bg-primary/[0.05] p-4">
                <Input value={editTeamName} onChange={(e) => setEditTeamName(e.target.value)} />
                <div className="flex flex-wrap gap-1.5">
                  {users.map((u) => {
                    const on = editTeamMembers.has(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() =>
                          setEditTeamMembers((prev) => {
                            const next = new Set(prev);
                            next.has(u.id) ? next.delete(u.id) : next.add(u.id);
                            return next;
                          })
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          on
                            ? "border-primary/50 bg-primary/[0.12] text-foreground"
                            : "border-border/70 bg-white/[0.02] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {u.name}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingTeamId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveTeamEdit} disabled={!editTeamName.trim()}>
                    <Check className="h-3.5 w-3.5" /> Save team
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={t.id}
                className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card px-5 py-4 ring-hairline"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {t.members.map((m) => m.name.split(" ")[0]).join(", ") || "No members"}
                  </div>
                </div>
                <button
                  onClick={() => startTeamEdit(t)}
                  title="Edit team"
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeTeam(t.id)}
                  title="Delete team"
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          )}
        </div>
      </div>
      {/* Add person */}
      <div className="mt-6 rounded-2xl border border-border/80 bg-card p-5 ring-hairline">
        <div className="mb-4 flex items-center gap-2 text-muted-foreground">
          <UserPlus className="h-4 w-4" />
          <SectionLabel>Add a person</SectionLabel>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-white/[0.02] px-3 text-sm text-foreground outline-none focus:border-primary/50 [&>option]:bg-elevated"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="custom">Other…</option>
            </select>
            {role === "custom" && (
              <Input
                placeholder="Role"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
              />
            )}
          </div>
          <Input
            placeholder="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Mobile number (e.g. +1 555 010 0000)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {teams.length > 0 && (
            <select
              value={newUserTeamId}
              onChange={(e) => setNewUserTeamId(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
              className="h-10 w-full rounded-lg border border-border bg-white/[0.02] px-3 text-sm text-foreground outline-none focus:border-primary/50 [&>option]:bg-elevated"
            >
              <option value="">No team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  Add to team: {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <NotifyToggle
            icon={<Mail className="h-3.5 w-3.5" />}
            label="Notify by email"
            on={notifyEmail}
            onToggle={() => setNotifyEmail(!notifyEmail)}
          />
          <NotifyToggle
            icon={<MessageSquare className="h-3.5 w-3.5" />}
            label="Notify by text"
            on={notifySms}
            onToggle={() => setNotifySms(!notifySms)}
          />
          <div className="ml-auto">
            <Button onClick={addUser} disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Add person
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/[0.08] px-3 py-2 text-xs text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" /> {error}
          </div>
        )}
      </div>

      {/* List */}
      <div className="mt-6 space-y-2.5">
        {users.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
            No people yet. Add your architect, client, and trades above.
          </div>
        )}
        {users.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card px-5 py-4 ring-hairline"
          >
            <Avatar person={u} className="h-9 w-9 text-xs" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{u.name}</span>
                <Badge variant="muted">{u.role}</Badge>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                {u.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {u.email}
                    {u.notifyEmail && <span className="text-emerald-400/90">· notified</span>}
                  </span>
                )}
                {u.phone && (
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" /> {u.phone}
                    {u.notifySms && <span className="text-emerald-400/90">· notified</span>}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => (editingId === u.id ? setEditingId(null) : startEdit(u))}
              title="Edit"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => removeUser(u.id)}
              title="Remove"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {editingId !== null && (
        <div className="mt-3 space-y-3 rounded-2xl border border-primary/30 bg-primary/[0.05] p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Editing {users.find((u) => u.id === editingId)?.name}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Full name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <Input placeholder="Role (e.g. Architect)" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })} />
            <Input placeholder="Email" type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            <Input placeholder="Mobile number" type="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NotifyToggle
              icon={<Mail className="h-3.5 w-3.5" />}
              label="Notify by email"
              on={edit.notifyEmail}
              onToggle={() => setEdit({ ...edit, notifyEmail: !edit.notifyEmail })}
            />
            <NotifyToggle
              icon={<MessageSquare className="h-3.5 w-3.5" />}
              label="Notify by text"
              on={edit.notifySms}
              onToggle={() => setEdit({ ...edit, notifySms: !edit.notifySms })}
            />
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveUserEdit} disabled={savingEdit || !edit.name.trim()}>
                {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function NotifyToggle({
  icon,
  label,
  on,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        on
          ? "border-primary/40 bg-primary/[0.1] text-foreground"
          : "border-border/70 bg-white/[0.02] text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

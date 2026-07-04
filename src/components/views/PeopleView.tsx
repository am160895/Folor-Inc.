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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, SectionLabel } from "@/components/shared";
import type { User } from "@/lib/types";

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
  onChanged,
}: {
  users: User[];
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [customRole, setCustomRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
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

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="pt-4">
        <h1 className="text-xl font-semibold tracking-tight">People</h1>
        <p className="text-sm text-muted-foreground">
          Everyone here can be added to decisions and asked to approve. Only a name is required —
          add an email or mobile number so they can be notified.
        </p>
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
              onClick={() => removeUser(u.id)}
              title="Remove"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </div>
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

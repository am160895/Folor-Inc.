"use client";

import { useState } from "react";
import { Building2, Mail, MessageSquare, ShieldCheck, Sparkles, Database, Check, Loader2, KeyRound, RefreshCw, Copy, CreditCard, ExternalLink } from "lucide-react";
import type { Team } from "@/lib/types";
import type { ConfigStatus, WorkspaceSettings } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/shared";

function genPassword() {
  const words = ["steel", "brick", "crane", "level", "frame", "beam", "stone", "north", "field", "site"];
  return (
    words[Math.floor(Math.random() * words.length)] +
    "-" +
    (Math.floor(Math.random() * 900) + 100) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

export function SettingsView({
  config,
  settings,
  teams,
  onChanged,
}: {
  config: ConfigStatus;
  settings: WorkspaceSettings;
  teams: Team[];
  onChanged: () => void;
}) {
  const [form, setForm] = useState<WorkspaceSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveSettings() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onChanged();
  }

  async function setPlan(plan: "trial" | "pro") {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    onChanged();
  }

  async function setTeamPassword(teamId: number, password: string) {
    await fetch(`/api/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    onChanged();
  }
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="pt-4">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Workspace, notification providers, and storage.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <Panel icon={<Building2 className="h-4 w-4" />} title="Workspace">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">Company name</div>
              <Input
                value={form.workspaceName}
                onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
              />
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">Currency</div>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-white/[0.02] px-3 text-sm text-foreground outline-none focus:border-primary/50 [&>option]:bg-elevated"
              >
                <option value="$">$ — Dollar</option>
                <option value="€">€ — Euro</option>
                <option value="£">£ — Pound</option>
              </select>
            </div>
          </div>
          <SettingToggle
            label="Auto-build project teams"
            description="Anyone added to a decision automatically joins that project's team"
            on={form.autoTeam}
            onToggle={() => setForm({ ...form, autoTeam: !form.autoTeam })}
          />
          <SettingToggle
            label="Require a reason on every decision"
            description="The Why field must be filled in before recording"
            on={form.requireReason}
            onToggle={() => setForm({ ...form, requireReason: !form.requireReason })}
          />
          <SettingToggle
            label="Project team sees new decisions by default"
            description="Pre-select the whole team as visible when capturing"
            on={form.defaultVisibility === "team"}
            onToggle={() =>
              setForm({ ...form, defaultVisibility: form.defaultVisibility === "team" ? "none" : "team" })
            }
          />
          <div className="flex justify-end pt-1">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saved ? "Saved" : "Save settings"}
            </Button>
          </div>
        </Panel>

        <Panel icon={<KeyRound className="h-4 w-4" />} title="Access & passwords">
          <div>
            <div className="mb-1.5 text-xs text-muted-foreground">
              Workspace admin password — full access to everything (that&apos;s you)
            </div>
            <div className="flex gap-2">
              <Input
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
              />
              <Button
                variant="secondary"
                size="sm"
                className="h-10 shrink-0"
                onClick={() => setForm({ ...form, adminPassword: genPassword() })}
                title="Generate a new password"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Generate
              </Button>
            </div>
            {form.adminPassword === "ledger123" && (
              <p className="mt-1.5 text-[11px] text-amber-300">
                You&apos;re using the default password — change it before going live.
              </p>
            )}
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Press Save settings above after changing it.
            </p>
          </div>

          <div className="border-t border-border/50 pt-3">
            <div className="mb-2 text-xs text-muted-foreground">
              Team passwords — members sign in with their email + their team&apos;s password.
              Members can record and view decisions; only you can manage people, teams,
              passwords, and settings.
            </div>
            {teams.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No teams yet — create teams on the People page first.
              </p>
            )}
            <div className="space-y-2">
              {teams.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <span className="w-36 shrink-0 truncate text-sm font-medium text-foreground">
                    {t.name}
                  </span>
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-border/60 bg-white/[0.02] px-2.5 py-2 text-xs text-foreground/90">
                    {t.password ?? "— no password set —"}
                  </code>
                  <button
                    onClick={() => setTeamPassword(t.id, genPassword())}
                    title="Generate new password"
                    className="shrink-0 rounded-lg border border-border/70 p-2 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  {t.password && (
                    <button
                      onClick={() => navigator.clipboard?.writeText(t.password!)}
                      title="Copy password"
                      className="shrink-0 rounded-lg border border-border/70 p-2 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Generating a new password takes effect immediately — share it with the team.
            </p>
          </div>
        </Panel>

        <Panel icon={<CreditCard className="h-4 w-4" />} title="Plan & billing">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-foreground">Current plan</div>
              <div className="text-xs text-muted-foreground">
                $49 per recorder / month. Acknowledging and viewing are always free for
                architects, owners and subs.
              </div>
            </div>
            <Badge variant={settings.plan === "pro" ? "success" : "muted"}>
              {settings.plan === "pro" ? "Pro" : "Trial"}
            </Badge>
          </div>
          {settings.plan !== "pro" && (
            <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs leading-relaxed text-amber-200/90">
              Trial workspaces get the full product — evidence packages and audit
              certificates carry a &quot;TRIAL&quot; watermark until you upgrade.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {config.billingLink && settings.plan !== "pro" && (
              <Button size="sm" onClick={() => window.open(config.billingLink!, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5" /> Upgrade — pay by card
              </Button>
            )}
            {settings.plan !== "pro" ? (
              <Button variant="outline" size="sm" onClick={() => setPlan("pro")}>
                Mark workspace as Pro (paid)
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setPlan("trial")}>
                Downgrade to trial
              </Button>
            )}
          </div>
          {!config.billingLink && (
            <p className="mt-2 text-[11px] text-muted-foreground/70">
              To take card payments here, create a Stripe payment link and set
              STRIPE_PAYMENT_LINK in your hosting variables.
            </p>
          )}
        </Panel>

        <Panel icon={<Mail className="h-4 w-4" />} title="Email notifications">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Email provider</div>
              <div className="text-xs text-muted-foreground">
                Invites, approval requests and FYIs are emailed to each person&apos;s address.
              </div>
            </div>
            <Badge variant={config.emailConfigured ? "success" : "muted"}>
              {config.emailConfigured ? "Connected" : "Demo mode"}
            </Badge>
          </div>
          {config.emailConfigured && config.emailSender && (
            <p className="mt-2 text-xs text-muted-foreground">
              Sending as <span className="font-mono text-foreground/85">{config.emailSender}</span>
            </p>
          )}
          {!config.emailConfigured && (
            <ConfigHint>
              Set variables where the app is hosted (e.g. Railway → Variables):
              <br />
              <code>GMAIL_USER=you@gmail.com</code> + <code>GMAIL_APP_PASSWORD=…</code> (free), or
              <br />
              <code>RESEND_API_KEY=re_…</code> + <code>EMAIL_FROM=&quot;Folor &lt;decisions@yourdomain.com&gt;&quot;</code>
            </ConfigHint>
          )}
        </Panel>

        <Panel icon={<MessageSquare className="h-4 w-4" />} title="Text message notifications">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Twilio</div>
              <div className="text-xs text-muted-foreground">
                Approval requests are texted to each person&apos;s mobile number.
              </div>
            </div>
            <Badge variant={config.smsConfigured ? "success" : "muted"}>
              {config.smsConfigured ? "Connected" : "Demo mode"}
            </Badge>
          </div>
          {!config.smsConfigured && (
            <ConfigHint>
              Add to <code className="text-primary/90">decisiongraph/.env.local</code>:
              <br />
              <code>TWILIO_ACCOUNT_SID=AC…</code>
              <br />
              <code>TWILIO_AUTH_TOKEN=…</code>
              <br />
              <code>TWILIO_FROM=+1555…</code>
            </ConfigHint>
          )}
        </Panel>

        <Panel icon={<Database className="h-4 w-4" />} title="Storage">
          <Row label="Database" value="Local file · data/decisiongraph.json" />
          <Row label="Contents" value="Decisions, people, projects, approvals, notifications, evidence" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Everything is saved locally and permanently. Back up the{" "}
            <code className="text-foreground/80">data</code> folder to keep a copy of the full
            decision record.
          </p>
        </Panel>

        <Panel icon={<Sparkles className="h-4 w-4" />} title="Capture">
          <Row label="Voice input" value="Browser speech-to-text (Chrome / Edge)" />
          <Row label="Auto-structure" value="Title, people, location, reason, and impact" />
        </Panel>

        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-white/[0.02] px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Every decision and approval response is stored permanently with its full audit trail.
        </div>
      </div>
    </div>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 ring-hairline">
      <div className="mb-4 flex items-center gap-2 text-muted-foreground">
        {icon}
        <SectionLabel>{title}</SectionLabel>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/40 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  on,
  onToggle,
}: {
  label: string;
  description: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          on ? "bg-primary" : "bg-white/[0.08]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ConfigHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-white/[0.02] px-3.5 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}

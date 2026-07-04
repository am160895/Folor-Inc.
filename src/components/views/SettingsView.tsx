"use client";

import { Building2, Mail, MessageSquare, ShieldCheck, Sparkles, Database } from "lucide-react";
import { CURRENT_USER } from "@/lib/data";
import type { ConfigStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/shared";

export function SettingsView({ config }: { config: ConfigStatus }) {
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
          <Row label="Organization" value={CURRENT_USER.company} />
          <Row label="Signed in as" value={`${CURRENT_USER.name} · ${CURRENT_USER.role}`} />
        </Panel>

        <Panel icon={<Mail className="h-4 w-4" />} title="Email notifications">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Resend</div>
              <div className="text-xs text-muted-foreground">
                Approval requests are emailed to each person&apos;s address.
              </div>
            </div>
            <Badge variant={config.emailConfigured ? "success" : "muted"}>
              {config.emailConfigured ? "Connected" : "Demo mode"}
            </Badge>
          </div>
          {!config.emailConfigured && (
            <ConfigHint>
              Add to <code className="text-primary/90">decisiongraph/.env.local</code>:
              <br />
              <code>RESEND_API_KEY=re_…</code>
              <br />
              <code>EMAIL_FROM=&quot;Folor &lt;decisions@yourdomain.com&gt;&quot;</code>
              <br />
              Free key at resend.com — then restart the app.
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
          <Row label="Database" value="Local file · decisiongraph/data/decisiongraph.json" />
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

function ConfigHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-white/[0.02] px-3.5 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}

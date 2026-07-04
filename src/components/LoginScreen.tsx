"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogIn } from "lucide-react";
import { LedgerMark } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (res.ok) onSuccess();
    else setError((await res.json()).error ?? "Sign in failed.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <LedgerMark size={44} />
          <div>
            <div className="text-xl font-semibold tracking-tight">Ledger</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Every decision. Recorded.
            </div>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-card p-6 ring-hairline"
        >
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">Email</div>
              <Input
                type="text"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="username"
              />
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">Password</div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Team or admin password"
                autoComplete="current-password"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <Button type="submit" size="lg" className="mt-4 w-full" disabled={busy || !email || !password}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Sign in
          </Button>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">
            Team members sign in with their email and their team&apos;s password.
            Admins use the workspace admin password (default: <code className="text-foreground/70">ledger123</code> —
            change it in Settings).
          </p>
        </form>
      </motion.div>
    </div>
  );
}

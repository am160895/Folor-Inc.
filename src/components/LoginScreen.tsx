"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogIn, MailCheck, UserPlus } from "lucide-react";
import { LedgerMark } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const REMEMBER_KEY = "ledger_remember_email";

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Prefill the last-used email; the browser's password manager fills the rest.
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) setEmail(saved);
  }, []);

  function rememberEmail() {
    if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
    else localStorage.removeItem(REMEMBER_KEY);
  }

  async function submitSignin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (res.ok) {
      rememberEmail();
      onSuccess();
    } else setError((await res.json()).error ?? "Sign in failed.");
  }

  async function submitSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(j.error ?? "Sign up failed.");
      return;
    }
    rememberEmail();
    if (j.verifyUrl) {
      // No email provider configured — follow the verification link directly.
      window.location.href = j.verifyUrl;
      return;
    }
    setSentTo(email.trim());
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

        {sentTo ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center ring-hairline">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <MailCheck className="h-7 w-7" />
            </div>
            <h1 className="text-lg font-semibold">Check your email</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              We sent a verification link to{" "}
              <span className="text-foreground">{sentTo}</span>. Tap it to finish
              creating your account.
            </p>
            <button
              onClick={() => setSentTo(null)}
              className="mt-4 text-xs text-primary hover:underline"
            >
              ← Back
            </button>
          </div>
        ) : (
          <form
            onSubmit={mode === "signin" ? submitSignin : submitSignup}
            className="rounded-2xl border border-border bg-card p-6 ring-hairline"
          >
            {/* Mode toggle */}
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-border/70 bg-white/[0.02] p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                    mode === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {mode === "signup" && (
                <div>
                  <div className="mb-1.5 text-xs text-muted-foreground">Full name</div>
                  <Input
                    type="text"
                    name="name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Pat Mason"
                    autoComplete="name"
                  />
                </div>
              )}
              <div>
                <div className="mb-1.5 text-xs text-muted-foreground">Email</div>
                <Input
                  type="email"
                  name="email"
                  autoFocus={mode === "signin"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="username"
                />
              </div>
              <div>
                <div className="mb-1.5 text-xs text-muted-foreground">
                  {mode === "signin" ? "Password" : "Choose a password"}
                </div>
                <Input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signin" ? "Your, team or admin password" : "At least 4 characters"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border bg-white/[0.03] accent-[#6d4aff]"
                />
                Remember my email on this device
              </label>
            </div>

            {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

            <Button
              type="submit"
              size="lg"
              className="mt-4 w-full"
              disabled={busy || !email || !password || (mode === "signup" && !name)}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signin" ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">
              {mode === "signin"
                ? "Sign in with your email and the password you were given. Forgot it? Ask your workspace admin."
                : "We'll email you a link to verify your address — that's all it takes."}
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, XCircle } from "lucide-react";
import { LedgerMark } from "@/components/shared";

export default function VerifyPage({ params }: { params: { token: string } }) {
  const [state, setState] = useState<"working" | "ok" | "bad">("working");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token }),
    })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Verification failed.");
        setName(j.name ?? "");
        setState("ok");
        setTimeout(() => {
          window.location.href = "/";
        }, 1800);
      })
      .catch((e) => {
        setError(e.message);
        setState("bad");
      });
  }, [params.token]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mb-6 flex justify-center">
          <LedgerMark size={44} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 ring-hairline">
          {state === "working" && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying your email…
            </div>
          )}
          {state === "ok" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <h1 className="text-lg font-semibold">You&apos;re verified{name ? `, ${name.split(" ")[0]}` : ""}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Taking you to Ledger…</p>
            </>
          )}
          {state === "bad" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
                <XCircle className="h-7 w-7" />
              </div>
              <h1 className="text-lg font-semibold">Link not valid</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{error}</p>
              <a href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
                Back to sign in →
              </a>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

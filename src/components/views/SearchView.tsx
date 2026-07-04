"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, CornerDownLeft } from "lucide-react";
import { runSearch, EXAMPLE_SEARCHES, type SearchResult } from "@/lib/data";
import type { Decision } from "@/lib/types";
import { DecisionCard } from "@/components/DecisionCard";

export function SearchView({
  decisions,
  onOpen,
}: {
  decisions: Decision[];
  onOpen: (d: Decision) => void;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  function search(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResult(null);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setResult(runSearch(q, decisions));
      setLoading(false);
    }, 450);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="pt-4 text-center sm:pt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gradient">
          Ask about any decision
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Natural-language search across every recorded decision. Answers come back as decisions,
          never files.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(query);
        }}
        className="group relative mt-6"
      >
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/25 to-accent/20 opacity-0 blur-md transition-opacity group-focus-within:opacity-60" />
        <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-surface/80 px-4 py-3 shadow-xl backdrop-blur-xl ring-hairline">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about any decision…"
            className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="hidden items-center gap-1 rounded-md border border-border bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-muted-foreground sm:flex">
            <CornerDownLeft className="h-3 w-3" /> Enter
          </kbd>
        </div>
      </form>

      {!result && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {EXAMPLE_SEARCHES.map((ex) => (
            <button
              key={ex}
              onClick={() => search(ex)}
              className="rounded-full border border-border/70 bg-white/[0.02] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 animate-pulse text-primary" />
            Searching decisions…
          </motion.div>
        )}

        {!loading && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="mb-5 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.08] to-transparent p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">{result.answer}</p>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground/70">
              <ArrowRight className="h-3.5 w-3.5" />
              {result.decisions.length} matching decision
              {result.decisions.length !== 1 ? "s" : ""}
            </div>

            <div className="space-y-3">
              {result.decisions.map((d, i) => (
                <DecisionCard key={d.id} decision={d} index={i} onClick={() => onOpen(d)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

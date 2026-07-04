"use client";

import { motion } from "framer-motion";
import { Mic, Type, Paperclip } from "lucide-react";

export function CaptureBar({
  onCapture,
}: {
  onCapture: (mode: "speak" | "type" | "upload") => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto w-full max-w-2xl"
    >
      <div className="group relative">
        {/* glow */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 opacity-40 blur-md transition-opacity group-focus-within:opacity-70" />
        <div className="relative flex items-center gap-2 rounded-2xl border border-border bg-surface/80 p-2 pl-4 shadow-xl backdrop-blur-xl ring-hairline">
          <button
            onClick={() => onCapture("type")}
            className="flex-1 text-left text-[15px] text-muted-foreground/80 transition-colors hover:text-muted-foreground"
          >
            Record a decision…
          </button>

          <div className="flex items-center gap-1.5">
            <CaptureButton
              label="Speak"
              icon={<Mic className="h-4 w-4" />}
              onClick={() => onCapture("speak")}
              primary
            />
            <CaptureButton
              label="Type"
              icon={<Type className="h-4 w-4" />}
              onClick={() => onCapture("type")}
            />
            <CaptureButton
              label="Upload"
              icon={<Paperclip className="h-4 w-4" />}
              onClick={() => onCapture("upload")}
            />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground/70">
        Captured in seconds — decision, people, reason, evidence, and impact.
      </p>
    </motion.div>
  );
}

function CaptureButton({
  label,
  icon,
  onClick,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        primary
          ? "flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-8px_rgba(124,92,255,0.7)] transition-transform hover:scale-[1.02] active:scale-95"
          : "flex items-center gap-1.5 rounded-xl border border-border bg-white/[0.02] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground"
      }
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

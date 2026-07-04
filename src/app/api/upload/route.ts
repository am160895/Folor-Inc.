import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { UPLOADS_DIR } from "@/lib/db";
import type { EvidenceKind } from "@/lib/types";

export const dynamic = "force-dynamic";

function kindOf(mime: string): EvidenceKind {
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("audio/")) return "voice";
  return "document";
}

function human(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "File is larger than 25 MB." }, { status: 400 });
  }

  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
  const stored = crypto.randomBytes(6).toString("hex") + "-" + safeName;
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOADS_DIR, stored), buf);

  return NextResponse.json({
    evidence: {
      kind: kindOf(file.type || ""),
      label: file.name,
      meta: human(file.size),
      file: stored,
    },
  });
}

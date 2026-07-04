import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { UPLOADS_DIR } from "@/lib/db";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".txt": "text/plain",
};

export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  // Only serve flat filenames from the uploads directory.
  const name = path.basename(params.name);
  const full = path.join(UPLOADS_DIR, name);
  if (!fs.existsSync(full)) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
  const ext = path.extname(name).toLowerCase();
  const body = fs.readFileSync(full);
  return new NextResponse(body, {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Disposition": 'inline; filename="' + name + '"',
    },
  });
}

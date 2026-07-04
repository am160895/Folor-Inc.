import { NextRequest, NextResponse } from "next/server";
import { deleteUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }
  deleteUser(id);
  return NextResponse.json({ ok: true });
}

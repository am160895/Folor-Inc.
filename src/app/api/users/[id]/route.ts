import { NextRequest, NextResponse } from "next/server";
import { sessionOf, unauthorized, forbidden } from "@/lib/auth";
import { deleteUser, updateUser } from "@/lib/db";

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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!sessionOf(req)) return unauthorized();
  if (!sessionOf(req)!.isAdmin) return forbidden();
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  const body = await req.json();
  const user = updateUser(id, body);
  if (!user) return NextResponse.json({ error: "Person not found." }, { status: 404 });
  return NextResponse.json({ user });
}

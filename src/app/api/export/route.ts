import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { buildExport } from "@/server/export";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const payload = await buildExport(session.user.id);
  return NextResponse.json(payload);
}

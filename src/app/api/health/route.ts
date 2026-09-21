import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "ai-engineering-platform" });
  } catch {
    return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }
}

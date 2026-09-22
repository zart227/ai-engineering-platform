import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/server/auth";
import { searchCourse } from "@/server/semantic-search";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Нужна сессия." }, { status: 401 });
  }
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const result = await searchCourse(query);
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}

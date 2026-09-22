import { NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { answerTutor } from "@/server/tutor";

export async function POST(request: Request) {
  const session = await getSession();
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const result = await answerTutor({ session, body });
  return NextResponse.json(result.body, { status: result.status });
}

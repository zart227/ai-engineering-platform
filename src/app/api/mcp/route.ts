import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/server/auth";
import { handlePlatformMcp } from "@/server/mcp";
import { liveMcpDeps } from "@/server/mcp-data";

export async function POST(request: NextRequest) {
  const session = await getSession();
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const result = await handlePlatformMcp({
    body,
    headers: {
      protocolVersion: request.headers.get("mcp-protocol-version"),
      method: request.headers.get("mcp-method"),
      name: request.headers.get("mcp-name"),
    },
    sessionUserId: session?.user.id ?? null,
    deps: liveMcpDeps(),
  });
  return NextResponse.json(result.body, { status: result.status });
}

import { createQlooService } from "@/lib/qloo/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only connectivity check. Does not echo credentials. */
export async function GET() {
  const qloo = createQlooService();
  if (!qloo.hasCredentials()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message: "QLOO_API_KEY is not set on the server.",
      },
      { status: 503 },
    );
  }

  const result = await qloo.smokeTest();
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        code: result.error.code,
        message: result.error.message,
        status: result.error.status ?? null,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    entityCount: result.entityCount,
    message: "Qloo search smoke test succeeded.",
  });
}

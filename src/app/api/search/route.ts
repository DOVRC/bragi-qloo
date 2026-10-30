import { createQlooService } from "@/lib/qloo/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION", message: "Query too short." } },
      { status: 400 },
    );
  }

  if (process.env.SAMPLE_DATA_MODE === "true") {
    return NextResponse.json({
      ok: true,
      mode: "sample",
      results: [{ id: "sample", name: query }],
      warning: "SAMPLE_DATA_MODE — not live Qloo search",
    });
  }

  const qloo = createQlooService();
  if (!qloo.hasCredentials()) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MISSING_API_KEY",
          message: "Qloo credentials are not configured on the server.",
        },
      },
      { status: 503 },
    );
  }

  try {
    const entities = await qloo.searchEntities({ query, take: 6 });
    return NextResponse.json({
      ok: true,
      mode: "live",
      results: entities.map((e) => ({ id: e.id, name: e.name, type: e.type ?? null })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json(
      { ok: false, error: { code: "SEARCH_FAILED", message } },
      { status: 502 },
    );
  }
}

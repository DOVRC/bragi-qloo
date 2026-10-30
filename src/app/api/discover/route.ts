import { DiscoveryAgent } from "@/lib/agent/discovery";
import { validateDiscoverRequest } from "@/lib/signals";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Qloo multi-step discovery can exceed default serverless limits. */
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        mode: process.env.SAMPLE_DATA_MODE === "true" ? "sample" : "live",
        error: { code: "BAD_JSON", message: "Invalid JSON body." },
        steps: [],
      },
      { status: 400 },
    );
  }

  const validated = validateDiscoverRequest(body);
  if (!validated.ok) {
    return NextResponse.json(
      {
        ok: false,
        mode: process.env.SAMPLE_DATA_MODE === "true" ? "sample" : "live",
        error: { code: "VALIDATION", message: validated.message },
        steps: [],
      },
      { status: 400 },
    );
  }

  const agent = new DiscoveryAgent();
  const result = await agent.run(validated.value);
  const status = result.ok ? 200 : result.error.code === "VALIDATION" ? 400 : 502;
  return NextResponse.json(result, { status: result.ok ? 200 : status });
}

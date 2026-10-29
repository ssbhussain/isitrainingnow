import { NextResponse } from "next/server";
import { syncAllCityWeather } from "@/lib/sync-city-weather";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const result = await syncAllCityWeather(5);
  return NextResponse.json({
    synced: result.synced,
    failed: result.failed,
    elapsedMs: Date.now() - started,
  });
}

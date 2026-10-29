import "server-only";

import { createClient } from "@supabase/supabase-js";
import { syncCityTicker } from "@/lib/ticker";
import { getWeatherIntelligence, type UnitSystem } from "@/lib/weather-engine";

export interface CitySyncRow {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  timezone: string;
  unit_system: UnitSystem;
}

export interface SyncFailure {
  slug: string;
  error: string;
}

export async function syncCityWeather(city: CitySyncRow): Promise<void> {
  const weather = await getWeatherIntelligence({
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
    unitSystem: city.unit_system,
  });
  await syncCityTicker(city.id, city.unit_system, weather);
}

export async function syncAllCityWeather(concurrency = 5): Promise<{ synced: number; failed: SyncFailure[] }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials are missing");
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase
    .from("iirn_cities")
    .select("id,slug,latitude,longitude,timezone,unit_system")
    .order("slug");
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as CitySyncRow[];
  const failed: SyncFailure[] = [];
  let synced = 0;
  let cursor = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = cursor;
      cursor += 1;
      const city = rows[index];
      if (!city) return;
      try {
        await syncCityWeather(city);
        synced += 1;
      } catch (cause) {
        failed.push({ slug: city.slug, error: cause instanceof Error ? cause.message : String(cause) });
      }
    }
  }

  const workers = Math.min(concurrency, Math.max(rows.length, 1));
  await Promise.all(Array.from({ length: rows.length === 0 ? 0 : workers }, () => worker()));
  return { synced, failed };
}

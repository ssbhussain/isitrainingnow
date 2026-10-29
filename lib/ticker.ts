import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { UnitSystem, WeatherIntelligence } from "@/lib/weather-engine";

export interface TickerCity {
  slug: string;
  name: string;
  country: string;
  current_precip_mm: number | null;
  current_temp_c: number | null;
  current_pressure_hpa: number | null;
}

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function toCelsius(weather: WeatherIntelligence): number | null {
  const value = weather.current.temperature.value;
  if (value == null) return null;
  return weather.unitSystem === "imperial" ? ((value - 32) * 5) / 9 : value;
}

function toMillimetres(weather: WeatherIntelligence): number | null {
  const value = weather.current.precipitation.value;
  if (value == null) return null;
  return weather.unitSystem === "imperial" ? value * 25.4 : value;
}

function toKmh(weather: WeatherIntelligence): number | null {
  const value = weather.current.windSpeed.value;
  if (value == null) return null;
  return weather.unitSystem === "metric" ? value : value / 0.621371;
}

function toHpa(weather: WeatherIntelligence): number | null {
  const value = weather.current.surfacePressure.value;
  if (value == null) return null;
  return weather.unitSystem === "imperial" ? value / 0.02953 : value;
}

export async function syncCityTicker(cityId: string, _unitSystem: UnitSystem, weather: WeatherIntelligence): Promise<void> {
  const supabase = serviceClient();
  if (!supabase) return;
  const status = weather.modules.minuteTimer.status;
  const tempC = toCelsius(weather);
  const heat = weather.modules.summer.heatstrokeRisk;
  await supabase.from("iirn_cities").update({
    is_raining_now: status === "YES — RAINING NOW" || status === "DRIZZLE / MIST NOW",
    is_snowing_now: status === "YES — SNOWING NOW",
    is_heatwave_now: heat === "High" || heat === "Very High" || heat === "Extreme" || (tempC != null && tempC >= 35),
    current_precip_mm: toMillimetres(weather) ?? 0,
    current_temp_c: tempC,
    current_wind_kph: toKmh(weather),
    current_pressure_hpa: toHpa(weather),
    last_weather_sync: new Date().toISOString(),
  }).eq("id", cityId);
}

export async function readTicker(): Promise<{
  rain: TickerCity[];
  snow: TickerCity[];
  heat: TickerCity[];
  pressure: TickerCity[];
}> {
  const empty = { rain: [], snow: [], heat: [], pressure: [] };
  const supabase = publicClient();
  if (!supabase) return empty;
  const columns = "slug,name,country,current_precip_mm,current_temp_c,current_pressure_hpa";
  const [rain, snow, heat, pressure] = await Promise.all([
    supabase.from("iirn_cities").select(columns).eq("is_raining_now", true).order("current_precip_mm", { ascending: false }).limit(6),
    supabase.from("iirn_cities").select(columns).eq("is_snowing_now", true).order("current_precip_mm", { ascending: false }).limit(6),
    supabase.from("iirn_cities").select(columns).eq("is_heatwave_now", true).order("current_temp_c", { ascending: false }).limit(6),
    supabase.from("iirn_cities").select(columns).not("current_pressure_hpa", "is", null).order("current_pressure_hpa", { ascending: true }).limit(6),
  ]);
  return {
    rain: (rain.data ?? []) as TickerCity[],
    snow: (snow.data ?? []) as TickerCity[],
    heat: (heat.data ?? []) as TickerCity[],
    pressure: (pressure.data ?? []) as TickerCity[],
  };
}

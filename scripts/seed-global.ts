/**
 * Populates iirn_cities and iirn_stadiums, then writes the live ticker flags.
 * Geocoding is Open-Meteo. Place context is gpt-4o-mini structured JSON via the provisioner.
 * Run: npm run seed
 */
import { readFileSync } from "node:fs";
import { PRIORITY_1, PRIORITY_2, PRIORITY_3, STADIUMS, type SeedPlace } from "./catalog.ts";
import { getOrProvisionCity, getOrProvisionStadium } from "../lib/city-provisioner.ts";
import { syncCityTicker } from "../lib/ticker.ts";
import { getWeatherIntelligence } from "../lib/weather-engine.ts";

function loadEnvFile(): void {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function pool<T>(items: T[], size: number, worker: (item: T, index: number) => Promise<void>): Promise<void> {
  let cursor = 0;
  async function run(): Promise<void> {
    for (;;) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      if (!item) return;
      await worker(item, index);
    }
  }
  const workers = Math.min(size, items.length);
  await Promise.all(Array.from({ length: workers }, () => run()));
}

async function withRetry(label: string, task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch (first) {
    const message = first instanceof Error ? first.message : String(first);
    console.log(`retry ${label}: ${message}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await task();
  }
}

async function seedCities(places: SeedPlace[], label: string, failures: string[]): Promise<void> {
  console.log(`\n${label}: ${places.length} cities`);
  await pool(places, 5, async (place, index) => {
    const mark = `${index + 1}/${places.length} ${place.slug}`;
    try {
      await withRetry(place.slug, async () => {
        const city = await getOrProvisionCity(place.slug, place.query);
        const weather = await getWeatherIntelligence({
          latitude: city.latitude,
          longitude: city.longitude,
          timezone: city.timezone,
          unitSystem: city.unit_system,
        });
        await syncCityTicker(city.id, city.unit_system, weather);
        const rain = weather.modules.minuteTimer.status;
        console.log(`ok ${mark} ${city.name}, ${city.country} ${rain}`);
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      failures.push(`${place.slug}: ${message}`);
      console.log(`fail ${mark}: ${message}`);
    }
  });
}

async function seedStadiums(failures: string[]): Promise<void> {
  console.log(`\nstadiums: ${STADIUMS.length}`);
  await pool(STADIUMS, 5, async (place, index) => {
    const mark = `${index + 1}/${STADIUMS.length} ${place.slug}`;
    try {
      await withRetry(place.slug, async () => {
        const stadium = await getOrProvisionStadium(place.slug, place.query);
        console.log(`ok ${mark} ${stadium.name} (${stadium.city_name}) ${stadium.drainage_system ?? ""}`);
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      failures.push(`${place.slug}: ${message}`);
      console.log(`fail ${mark}: ${message}`);
    }
  });
}

async function main(): Promise<void> {
  loadEnvFile();
  if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  const failures: string[] = [];
  const only = new Set((process.env.SEED_SLUGS ?? "").split(",").map((item) => item.trim()).filter(Boolean));
  const cities = [...PRIORITY_1, ...PRIORITY_2, ...PRIORITY_3].filter((place) => only.size === 0 || only.has(place.slug));
  const stadiums = only.size === 0 ? STADIUMS : STADIUMS.filter((place) => only.has(place.slug));
  console.log(`Seeding ${cities.length} cities and ${stadiums.length} stadiums, 5 at a time`);
  await seedCities(cities.filter((place) => PRIORITY_1.some((item) => item.slug === place.slug)), "priority 1", failures);
  await seedCities(cities.filter((place) => PRIORITY_2.some((item) => item.slug === place.slug)), "priority 2", failures);
  await seedCities(cities.filter((place) => PRIORITY_3.some((item) => item.slug === place.slug)), "priority 3", failures);
  if (stadiums.length > 0) await seedStadiums(failures);
  console.log(`\nDone. Failures: ${failures.length}`);
  for (const failure of failures) console.log(`- ${failure}`);
  if (failures.length > 0) process.exitCode = 1;
}

await main();

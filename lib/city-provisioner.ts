/**
 * Self-growing city and stadium records.
 * Coordinates, country, and timezone come from Open-Meteo geocoding.
 * Neighborhoods, airports, transit, flood corridors, housing, and climate normals
 * come from gpt-4o-mini structured output, then are range-checked before insert.
 * unit_system and weather_agency are deterministic from the country code.
 */
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export class CityProvisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CityProvisionError";
  }
}

export interface NeighborhoodRecord {
  name: string;
  lat: number;
  lng: number;
  landmark: string;
}

export interface AirportRecord {
  iata_code: string;
  name: string;
}

export interface ClimateSummary {
  annual_rain_mm: number;
  peak_rain_months: string[];
  winter_freeze_months: string[];
  peak_heat_months: string[];
}

export type UnitSystem = "imperial" | "uk_hybrid" | "metric";

export interface IirnCity {
  id: string;
  slug: string;
  name: string;
  state_region: string | null;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation_m: number | null;
  unit_system: UnitSystem;
  weather_agency: string;
  neighborhoods: NeighborhoodRecord[];
  local_airports: AirportRecord[];
  local_transit_system: string | null;
  flood_and_traffic_hotspots: string[] | null;
  housing_and_pipe_profile: string | null;
  climate_summary: ClimateSummary | null;
  is_raining_now: boolean;
  is_snowing_now: boolean;
  is_heatwave_now: boolean;
  current_precip_mm: number;
  current_temp_c: number | null;
  current_wind_kph: number | null;
  current_pressure_hpa: number | null;
  last_weather_sync: string;
  search_hits: number;
  is_indexed: boolean;
  created_at: string;
}

export interface IirnStadium {
  id: string;
  slug: string;
  name: string;
  city_name: string;
  country: string;
  country_code: string;
  sport: string;
  latitude: number;
  longitude: number;
  timezone: string;
  roof_type: string | null;
  drainage_system: string | null;
  pitch_and_wind_notes: string | null;
  capacity: number | null;
  created_at: string;
}

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country_code: string;
  country?: string;
  admin1?: string;
  timezone: string;
  population?: number;
  feature_code?: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const AGENCIES: Record<string, string> = {
  US: "NOAA / National Weather Service",
  GB: "UK Met Office",
  CA: "Environment Canada",
  AU: "Bureau of Meteorology (BOM)",
  IN: "India Meteorological Department (IMD)",
};

const cityProfileSchema = z.object({
  neighborhoods: z.array(z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
    landmark: z.string(),
  })).min(6).max(6),
  local_airports: z.array(z.object({
    iata_code: z.string(),
    name: z.string(),
  })).min(1).max(3),
  local_transit_system: z.string(),
  flood_and_traffic_hotspots: z.array(z.string()).min(4).max(4),
  housing_and_pipe_profile: z.string(),
  climate_summary: z.object({
    annual_rain_mm: z.number(),
    peak_rain_months: z.array(z.string()).min(1).max(4),
    winter_freeze_months: z.array(z.string()).max(6),
    peak_heat_months: z.array(z.string()).min(1).max(4),
  }),
});

const stadiumProfileSchema = z.object({
  name: z.string(),
  city_name: z.string(),
  sport: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  roof_type: z.string(),
  drainage_system: z.string(),
  pitch_and_wind_notes: z.string(),
  capacity: z.number().int(),
});

type CityProfile = z.infer<typeof cityProfileSchema>;
type StadiumProfile = z.infer<typeof stadiumProfileSchema>;

const cityInflight = new Map<string, Promise<IirnCity>>();
const stadiumInflight = new Map<string, Promise<IirnStadium>>();

let supabaseClient: SupabaseClient | null = null;

function serviceClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new CityProvisionError("Supabase service credentials are not configured");
  }
  supabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseClient;
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function unitSystemForCountry(countryCode: string): UnitSystem {
  if (countryCode === "US") return "imperial";
  if (countryCode === "GB") return "uk_hybrid";
  return "metric";
}

export function weatherAgencyForCountry(countryCode: string): string {
  return AGENCIES[countryCode] ?? "National meteorological service";
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earth = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(a));
}

function canonicalMonth(value: string): string | null {
  return MONTHS.find((month) => month.toLowerCase() === value.trim().toLowerCase()) ?? null;
}

function normalizeMonths(values: string[], label: string, errors: string[]): string[] {
  const cleaned: string[] = [];
  for (const value of values) {
    const raw = value.trim();
    if (!raw || /^(none|n\/a|na|no|never|null)$/i.test(raw)) continue;
    const month = canonicalMonth(raw);
    if (!month) errors.push(`${label} contains an invalid month: ${value}`);
    else cleaned.push(month);
  }
  return cleaned;
}

export function validateCityProfile(profile: CityProfile, geo: GeoResult): string[] {
  const errors: string[] = [];
  const names = new Set<string>();
  for (const neighborhood of profile.neighborhoods) {
    const key = neighborhood.name.trim().toLowerCase();
    if (key.length < 2) errors.push("A neighborhood is missing its name");
    if (names.has(key)) errors.push(`Duplicate neighborhood: ${neighborhood.name}`);
    names.add(key);
    if (neighborhood.landmark.trim().length < 3) {
      errors.push(`${neighborhood.name} is missing a real landmark`);
    }
    const distance = distanceKm(geo.latitude, geo.longitude, neighborhood.lat, neighborhood.lng);
    if (!Number.isFinite(distance) || distance > 80) {
      errors.push(`${neighborhood.name} is ${distance.toFixed(0)} km from ${geo.name}; keep districts inside 80 km`);
    }
  }

  const codes = new Set<string>();
  for (const airport of profile.local_airports) {
    const code = airport.iata_code.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) errors.push(`Invalid IATA code: ${airport.iata_code}`);
    if (codes.has(code)) errors.push(`Duplicate airport code: ${code}`);
    codes.add(code);
    if (airport.name.trim().length < 4) errors.push(`Airport ${code} is missing its name`);
  }

  if (profile.local_transit_system.trim().length < 3) {
    errors.push("Local transit system name is missing");
  }

  const hotspots = new Set<string>();
  if (profile.flood_and_traffic_hotspots.length !== 4) {
    errors.push("Exactly 4 flood or traffic hotspots are required");
  }
  for (const hotspot of profile.flood_and_traffic_hotspots) {
    const cleaned = hotspot.trim();
    if (cleaned.length < 6 && !/^(?:I|US|A|M|NH|SH)-?\d{1,4}$/i.test(cleaned)) {
      errors.push(`Hotspot is too vague: ${hotspot}`);
    }
    const key = cleaned.toLowerCase();
    if (hotspots.has(key)) errors.push(`Duplicate hotspot: ${cleaned}`);
    hotspots.add(key);
  }

  const housing = profile.housing_and_pipe_profile.trim();
  const fold = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const acceptedNames = [geo.name, geo.admin1].filter(Boolean).map((value) => fold(value!));
  if (housing.length < 40 || !acceptedNames.some((name) => fold(housing).includes(name))) {
    errors.push(`Housing profile must mention ${geo.name} and describe local building stock`);
  }

  const rain = profile.climate_summary.annual_rain_mm;
  if (!Number.isFinite(rain) || rain < 0 || rain > 12000) {
    errors.push("Annual rainfall must be a realistic millimetre total between 0 and 12000");
  }
  normalizeMonths(profile.climate_summary.peak_rain_months, "Peak rain months", errors);
  normalizeMonths(profile.climate_summary.winter_freeze_months, "Winter freeze months", errors);
  normalizeMonths(profile.climate_summary.peak_heat_months, "Peak heat months", errors);
  return errors;
}

async function neighborhoodIsLocal(neighborhood: CityProfile["neighborhoods"][number], geo: GeoResult): Promise<boolean> {
  const pinDistance = distanceKm(geo.latitude, geo.longitude, neighborhood.lat, neighborhood.lng);
  if (pinDistance <= 40) return true;
  const sameCountry = (hit: GeoResult) => hit.country_code?.toUpperCase() === geo.country_code;
  const qualified = (await geocode(`${neighborhood.name}, ${geo.name}`)).filter(sameCountry);
  const nearCity = qualified.some((hit) => distanceKm(geo.latitude, geo.longitude, hit.latitude, hit.longitude) <= 80);
  if (nearCity) return true;
  const hits = (await geocode(neighborhood.name)).filter(sameCountry);
  if (hits.length === 0) return true;
  const nearestCity = Math.min(...hits.map((hit) => distanceKm(geo.latitude, geo.longitude, hit.latitude, hit.longitude)));
  const nearestClaim = Math.min(...hits.map((hit) => distanceKm(neighborhood.lat, neighborhood.lng, hit.latitude, hit.longitude)));
  return nearestCity <= 150 || nearestClaim <= 150;
}

async function airportIsConsistent(airport: CityProfile["local_airports"][number], geo: GeoResult): Promise<boolean> {
  const sameCountry = (hit: GeoResult) => hit.country_code?.toUpperCase() === geo.country_code;
  const namedHits = await geocode(airport.name);
  const named = namedHits
    .map((hit) => ({ hit, distance: distanceKm(geo.latitude, geo.longitude, hit.latitude, hit.longitude) }))
    .filter((item) => sameCountry(item.hit))
    .sort((left, right) => left.distance - right.distance)[0];
  if (named && named.distance <= 180) {
    const codeHits = (await geocode(airport.iata_code)).filter(sameCountry);
    if (codeHits.length === 0) return true;
    const codeDistance = Math.min(...codeHits.map((hit) => distanceKm(named.hit.latitude, named.hit.longitude, hit.latitude, hit.longitude)));
    return codeDistance <= 40;
  }
  const codeHits = (await geocode(airport.iata_code)).filter(sameCountry);
  if (codeHits.length === 0) return false;
  const nearestCode = Math.min(...codeHits.map((hit) => distanceKm(geo.latitude, geo.longitude, hit.latitude, hit.longitude)));
  return nearestCode <= 80;
}

async function fillProfileGaps(
  geo: GeoResult,
  keptNeighborhoods: CityProfile["neighborhoods"],
  keptAirports: CityProfile["local_airports"],
  banned: string[],
): Promise<Pick<CityProfile, "neighborhoods" | "local_airports">> {
  const needNeighborhoods = 6 - keptNeighborhoods.length;
  const needAirports = keptAirports.length === 0;
  const schema = z.object({
    neighborhoods: z.array(z.object({
      name: z.string(),
      lat: z.number(),
      lng: z.number(),
      landmark: z.string(),
    })).min(needNeighborhoods).max(needNeighborhoods),
    local_airports: z.array(z.object({
      iata_code: z.string(),
      name: z.string(),
    })).min(needAirports ? 1 : 0).max(needAirports ? 2 : 0),
  });
  const keptNames = keptNeighborhoods.map((item) => item.name).join(", ") || "none";
  const { output } = await generateText({
    model: openai("gpt-4o-mini"),
    temperature: 0,
    output: Output.object({ schema }),
    system: "You replace rejected local places with different real places in the same city. Never repeat a banned name or IATA code.",
    prompt: [
      `City: ${geo.name}, ${geo.admin1 ?? geo.country_code} (${geo.country_code})`,
      `City-center coordinates: ${geo.latitude}, ${geo.longitude}`,
      `Keep these neighborhoods and do not repeat them: ${keptNames}`,
      `Banned names and codes: ${banned.join(", ") || "none"}`,
      needNeighborhoods > 0
        ? `Return exactly ${needNeighborhoods} different real districts inside ${geo.name}, within 25 km of the city center.`
        : "Return an empty neighborhoods array.",
      needAirports
        ? `Return 1 or 2 commercial airports within 180 km of ${geo.name}. The IATA code must geocode to the same place as the airport name.`
        : "Return an empty local_airports array.",
    ].join("\n"),
  });
  if (!output) throw new CityProvisionError(`No replacement places were returned for ${geo.name}`);
  return output;
}

function normalizeProfile(profile: CityProfile): CityProfile {
  const errors: string[] = [];
  return {
    ...profile,
    neighborhoods: profile.neighborhoods.map((item) => ({
      name: item.name.trim(),
      lat: item.lat,
      lng: item.lng,
      landmark: item.landmark.trim(),
    })),
    local_airports: profile.local_airports.map((item) => ({
      iata_code: item.iata_code.trim().toUpperCase(),
      name: item.name.trim(),
    })),
    local_transit_system: profile.local_transit_system.trim(),
    flood_and_traffic_hotspots: profile.flood_and_traffic_hotspots.map((item) => item.trim()),
    housing_and_pipe_profile: profile.housing_and_pipe_profile.trim(),
    climate_summary: {
      annual_rain_mm: Math.round(profile.climate_summary.annual_rain_mm),
      peak_rain_months: normalizeMonths(profile.climate_summary.peak_rain_months, "Peak rain months", errors),
      winter_freeze_months: normalizeMonths(profile.climate_summary.winter_freeze_months, "Winter freeze months", errors),
      peak_heat_months: normalizeMonths(profile.climate_summary.peak_heat_months, "Peak heat months", errors),
    },
  };
}

async function geocode(name: string, countryCode?: string): Promise<GeoResult[]> {
  const params = new URLSearchParams({
    name,
    count: "10",
    language: "en",
    format: "json",
  });
  if (countryCode) params.set("countryCode", countryCode);
  const init: RequestInit = process.env.NEXT_RUNTIME
    ? ({ next: { revalidate: 86_400 } } as RequestInit)
    : {};
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, init);
  if (!response.ok) {
    throw new CityProvisionError(`Geocoding failed with status ${response.status}`);
  }
  const payload = (await response.json()) as { results?: GeoResult[] };
  return payload.results ?? [];
}

export function pickGeocode(results: GeoResult[], slug: string): GeoResult | null {
  if (results.length === 0) return null;
  const ranked = [...results].sort((a, b) => scoreGeocode(b, slug) - scoreGeocode(a, slug));
  return ranked[0] ?? null;
}

function scoreGeocode(result: GeoResult, slug: string): number {
  const nameSlug = slugify(result.name);
  let score = Math.log10((result.population ?? 1) + 1);
  if (nameSlug === slug) score += 100;
  else if (nameSlug.includes(slug) || slug.includes(nameSlug)) score += 25;
  if (result.feature_code?.startsWith("PPL")) score += 8;
  if (result.timezone) score += 1;
  return score;
}

async function generateProfile(geo: GeoResult, feedback?: string): Promise<CityProfile> {
  const prompt = [
    `City: ${geo.name}`,
    geo.admin1 ? `Region: ${geo.admin1}` : "",
    `Country: ${geo.country ?? geo.country_code} (${geo.country_code})`,
    `City-center coordinates: ${geo.latitude}, ${geo.longitude}`,
    `Timezone: ${geo.timezone}`,
    "Return 6 real districts or suburbs of this exact city, each with its centroid latitude and longitude and one real landmark in that district. Do not reuse a neighborhood name from another city.",
    "Return 1 to 3 commercial airports that actually serve this city. Use the airport's real map name and the IATA code for that same airport. The airport must sit within 180 km. Do not borrow a code from another state.",
    "Return the real local public-transit system name.",
    "Return exactly 4 real flood-prone or congested roads, underpasses, or commute corridors in this city. Each one must name the road and a place on it, at least 12 characters, such as 'I-95 at Downtown'. Never return a bare route number.",
    "winter_freeze_months is an empty array when the city rarely freezes. Never write None, N/A, or a sentence.",
    "Describe local housing and pipe or roof traits that change freeze or flood risk. Mention the city name. Do not use a generic sentence that could fit another city.",
    "Climate summary must use full English month names and a realistic annual rainfall total in millimetres.",
    feedback ? `The previous answer was rejected. Replace every rejected place. Do not reuse a rejected neighborhood name or IATA code:\n${feedback}` : "",
  ].filter(Boolean).join("\n");

  const { output } = await generateText({
    model: openai("gpt-4o-mini"),
    temperature: 0,
    output: Output.object({ schema: cityProfileSchema }),
    system: "You provide factual local geography for one named city. Never invent airports, neighborhoods, landmarks, or roads. If a code or place is uncertain, choose a better-known real one in the same city instead of guessing.",
    prompt,
  });
  if (!output) throw new CityProvisionError(`No structured profile was returned for ${geo.name}`);
  return output;
}

async function selectCity(supabase: SupabaseClient, slug: string): Promise<IirnCity | null> {
  const { data, error } = await supabase.from("iirn_cities").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new CityProvisionError(error.message);
  return (data as IirnCity | null) ?? null;
}

async function selectStadium(supabase: SupabaseClient, slug: string): Promise<IirnStadium | null> {
  const { data, error } = await supabase.from("iirn_stadiums").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new CityProvisionError(error.message);
  return (data as IirnStadium | null) ?? null;
}

async function provisionCity(supabase: SupabaseClient, slug: string, searchName?: string): Promise<IirnCity> {
  const query = (searchName?.trim() || slug.replace(/-/g, " ")).trim();
  const results = await geocode(query);
  const geo = pickGeocode(results, slug);
  if (!geo?.country_code || !geo.timezone) {
    throw new CityProvisionError(`No geocoding match for ${query}`);
  }
  geo.country_code = geo.country_code.toUpperCase();

  let feedback: string | undefined;
  let profile: CityProfile | null = null;
  let draft = await generateProfile(geo);
  const banned: string[] = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const structural = validateCityProfile(draft, geo);
    if (structural.length > 0) {
      feedback = structural.join("; ");
      banned.push(...structural);
      draft = await generateProfile(geo, feedback);
      continue;
    }

    const neighborhoodFlags = await Promise.all(draft.neighborhoods.map((item) => neighborhoodIsLocal(item, geo)));
    const airportFlags = await Promise.all(draft.local_airports.map((item) => airportIsConsistent(item, geo)));
    const keptNeighborhoods = draft.neighborhoods.filter((_, index) => neighborhoodFlags[index]);
    const keptAirports = draft.local_airports.filter((_, index) => airportFlags[index]);
    banned.push(
      ...draft.neighborhoods.filter((_, index) => !neighborhoodFlags[index]).map((item) => item.name),
      ...draft.local_airports.filter((_, index) => !airportFlags[index]).map((item) => `${item.iata_code} ${item.name}`),
    );

    if (keptNeighborhoods.length === 6 && keptAirports.length >= 1) {
      profile = normalizeProfile({ ...draft, neighborhoods: keptNeighborhoods, local_airports: keptAirports });
      break;
    }

    const filled = await fillProfileGaps(geo, keptNeighborhoods, keptAirports, banned);
    draft = {
      ...draft,
      neighborhoods: [...keptNeighborhoods, ...filled.neighborhoods].slice(0, 6),
      local_airports: keptAirports.length > 0 ? keptAirports : filled.local_airports,
    };
    feedback = `Dropped far-away places: ${banned.join(", ")}`;
  }
  if (!profile) {
    const structural = validateCityProfile(draft, geo);
    const neighborhoodFlags = await Promise.all(draft.neighborhoods.map((item) => neighborhoodIsLocal(item, geo)));
    const airportFlags = await Promise.all(draft.local_airports.map((item) => airportIsConsistent(item, geo)));
    if (structural.length === 0 && neighborhoodFlags.every(Boolean) && airportFlags.some(Boolean) && draft.neighborhoods.length === 6) {
      profile = normalizeProfile(draft);
    }
  }
  if (!profile) {
    throw new CityProvisionError(`City profile for ${geo.name} failed validation: ${feedback ?? "places could not be verified"}`);
  }

  const countryCode = geo.country_code;
  const { data, error } = await supabase.from("iirn_cities").insert({
    slug,
    name: geo.name,
    state_region: geo.admin1 ?? null,
    country: geo.country ?? countryCode,
    country_code: countryCode,
    latitude: geo.latitude,
    longitude: geo.longitude,
    timezone: geo.timezone,
    elevation_m: geo.elevation ?? 10,
    unit_system: unitSystemForCountry(countryCode),
    weather_agency: weatherAgencyForCountry(countryCode),
    neighborhoods: profile.neighborhoods,
    local_airports: profile.local_airports,
    local_transit_system: profile.local_transit_system,
    flood_and_traffic_hotspots: profile.flood_and_traffic_hotspots,
    housing_and_pipe_profile: profile.housing_and_pipe_profile,
    climate_summary: profile.climate_summary,
  }).select("*").single();

  if (error?.code === "23505") {
    const existing = await selectCity(supabase, slug);
    if (existing) return existing;
  }
  if (error || !data) throw new CityProvisionError(error?.message ?? `Insert failed for ${slug}`);
  return data as IirnCity;
}

async function generateStadium(name: string, feedback?: string): Promise<StadiumProfile> {
  const prompt = [
    `Venue query: ${name}`,
    "Identify the real stadium or ground this name refers to.",
    "Use the venue's actual coordinates, host city, sport, published capacity, and roof.",
    "roof_type is Open Air unless the venue has a documented dome, fixed roof, or retractable roof.",
    "drainage_system is Standard Grass Outfield (75 min recovery) unless a documented system such as SubAir exists. If it does, include the recovery minutes in the string.",
    "pitch_and_wind_notes must describe this ground's actual orientation, slope, or prevailing wind. Do not write a generic sentence.",
    feedback ? `Fix these problems from the previous answer: ${feedback}` : "",
  ].filter(Boolean).join("\n");

  const { output } = await generateText({
    model: openai("gpt-4o-mini"),
    temperature: 0,
    output: Output.object({ schema: stadiumProfileSchema }),
    system: "You identify real sports venues. Never invent a stadium, city, or capacity. Use published figures only.",
    prompt,
  });
  if (!output) throw new CityProvisionError(`No structured stadium profile was returned for ${name}`);
  return output;
}

async function provisionStadium(supabase: SupabaseClient, slug: string, searchName?: string): Promise<IirnStadium> {
  const query = (searchName?.trim() || slug.replace(/-/g, " ")).trim();
  let feedback: string | undefined;
  let profile: StadiumProfile | null = null;
  let geo: GeoResult | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const generated = await generateStadium(query, feedback);
    const errors: string[] = [];
    if (generated.name.trim().length < 3) errors.push("Stadium name is missing");
    if (generated.city_name.trim().length < 2) errors.push("Host city is missing");
    if (generated.sport.trim().length < 3) errors.push("Sport is missing");
    if (generated.capacity < 1000 || generated.capacity > 250000) errors.push("Capacity is outside a plausible published range");
    const results = await geocode(generated.city_name);
    geo = pickGeocode(results, slugify(generated.city_name));
    if (!geo?.timezone || !geo.country_code) {
      errors.push(`Host city ${generated.city_name} did not geocode`);
    } else if (distanceKm(geo.latitude, geo.longitude, generated.latitude, generated.longitude) > 60) {
      errors.push("Venue coordinates are more than 60 km from the geocoded host city");
    }
    if (errors.length === 0 && geo) {
      profile = generated;
      break;
    }
    feedback = errors.join("; ");
  }

  if (!profile || !geo) {
    throw new CityProvisionError(`Stadium profile for ${query} failed validation: ${feedback ?? "unknown error"}`);
  }

  const countryCode = geo.country_code.toUpperCase();
  const { data, error } = await supabase.from("iirn_stadiums").insert({
    slug,
    name: profile.name.trim(),
    city_name: geo.name,
    country: geo.country ?? countryCode,
    country_code: countryCode,
    sport: profile.sport.trim(),
    latitude: profile.latitude,
    longitude: profile.longitude,
    timezone: geo.timezone,
    roof_type: profile.roof_type.trim() || "Open Air",
    drainage_system: profile.drainage_system.trim() || "Standard Grass Outfield (75 min recovery)",
    pitch_and_wind_notes: profile.pitch_and_wind_notes.trim(),
    capacity: profile.capacity,
  }).select("*").single();

  if (error?.code === "23505") {
    const existing = await selectStadium(supabase, slug);
    if (existing) return existing;
  }
  if (error || !data) throw new CityProvisionError(error?.message ?? `Insert failed for ${slug}`);
  return data as IirnStadium;
}

async function loadCity(slug: string, searchName?: string): Promise<IirnCity> {
  const supabase = serviceClient();
  const existing = await selectCity(supabase, slug);
  if (existing) return existing;
  return provisionCity(supabase, slug, searchName);
}

async function loadStadium(slug: string, searchName?: string): Promise<IirnStadium> {
  const supabase = serviceClient();
  const existing = await selectStadium(supabase, slug);
  if (existing) return existing;
  return provisionStadium(supabase, slug, searchName);
}

export function getOrProvisionCity(slug: string, searchName?: string): Promise<IirnCity> {
  const key = slugify(slug);
  if (!key) return Promise.reject(new CityProvisionError("City slug is empty"));
  const pending = cityInflight.get(key);
  if (pending) return pending;
  const promise = loadCity(key, searchName).finally(() => {
    cityInflight.delete(key);
  });
  cityInflight.set(key, promise);
  return promise;
}

export function getOrProvisionStadium(slug: string, searchName?: string): Promise<IirnStadium> {
  const key = slugify(slug);
  if (!key) return Promise.reject(new CityProvisionError("Stadium slug is empty"));
  const pending = stadiumInflight.get(key);
  if (pending) return pending;
  const promise = loadStadium(key, searchName).finally(() => {
    stadiumInflight.delete(key);
  });
  stadiumInflight.set(key, promise);
  return promise;
}

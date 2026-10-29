/**
 * Deterministic Open-Meteo intelligence for isitrainingnow.
 * Telemetry is always requested in SI units. Scores use those SI values.
 * Display quantities are converted from the city unit system:
 * imperial → °F, mph, inches, inHg; uk_hybrid → °C, mph, mm, hPa; metric → °C, km/h, mm, hPa.
 *
 * Formulas:
 * - Dew point: Alduchov–Eskridge Magnus approximation
 * - Wind chill: US National Weather Service
 * - Frostbite timer: NWS chart anchors (−18°F ≈ 30 min, −33°F ≈ 10 min, −48°F ≈ 5 min)
 * - WBGT: Australian Bureau of Meteorology shade approximation, plus a capped daytime solar term
 * - Minutes to sunburn: 200 / UV index for Fitzpatrick type II skin
 * - Pavement: up to +25°C over air temperature in full sun (UV 10, clear sky)
 * - EV range: 15% loss at 0°C, then +1.15 points per degree below freezing (cap 45%)
 * - Tire pressure: 1 PSI drop per 10°F below a 70°F placard fill
 * - Gutter: 1,500 sq ft roof, runoff coefficient 0.95 (1 mm over 1 m² = 1 litre)
 */

export class WeatherEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherEngineError";
  }
}

export type UnitSystem = "imperial" | "uk_hybrid" | "metric";

export type RainStatus =
  | "YES — RAINING NOW"
  | "YES — SNOWING NOW"
  | "DRIZZLE / MIST NOW"
  | "NO — DRY RIGHT NOW";

export interface Quantity {
  value: number | null;
  unit: string;
}

export interface NeighborhoodInput {
  name: string;
  lat: number;
  lng: number;
  landmark?: string;
}

export interface StadiumInput {
  name: string;
  sport: string;
  drainageSystem: string;
  roofType?: string | null;
}

export interface WeatherEngineInput {
  latitude: number;
  longitude: number;
  timezone: string;
  unitSystem: UnitSystem;
  neighborhoods?: NeighborhoodInput[];
  stadium?: StadiumInput | null;
}

export interface WeatherIntelligence {
  observationTime: string;
  timezone: string;
  unitSystem: UnitSystem;
  cacheRevalidateSeconds: 900;
  hourlyWindow: Array<{
    label: string;
    precipitation: Quantity;
    probabilityPct: number | null;
    temperature: Quantity;
    gust: Quantity;
  }>;
  current: {
    temperature: Quantity;
    apparentTemperature: Quantity;
    relativeHumidityPct: number | null;
    isDay: boolean;
    precipitation: Quantity;
    rain: Quantity;
    showers: Quantity;
    snowfall: Quantity;
    weatherCode: number | null;
    cloudCoverPct: number | null;
    pressureMsl: Quantity;
    surfacePressure: Quantity;
    windSpeed: Quantity;
    windDirectionDeg: number | null;
    windGust: Quantity;
    uvIndex: number | null;
    visibility: Quantity;
    soilTemperature: Quantity;
    soilMoistureM3: number | null;
    freezingLevel: Quantity;
    capeJkg: number | null;
    snowDepth: Quantity;
    usAqi: number | null;
    pm2_5: Quantity;
    pm10: Quantity;
    pollenGrainsM3: {
      alder: number | null;
      birch: number | null;
      grass: number | null;
      ragweed: number | null;
    };
  };
  modules: {
    minuteTimer: MinuteTimer;
    neighborhoodGrid: NeighborhoodGrid;
    winter: WinterModule;
    summer: SummerModule;
    pipeAndFlood: PipeAndFloodModule;
    roofAndGutter: RoofAndGutterModule;
    pressureHealth: PressureHealthModule;
    commuteAndEv: CommuteModule;
    stadium: StadiumModule | null;
  };
}

export interface MinuteTimer {
  status: RainStatus;
  change: "starts" | "stops" | "persists";
  minutesUntilChange: number | null;
  nextDryWindowMinutes: number | null;
  resolutionMinutes: 15 | 60;
  past6hRain: Quantity;
  past24hRain: Quantity;
  past6hSnow: Quantity;
  past24hSnow: Quantity;
  summary: string;
}

export interface NeighborhoodGrid {
  cells: Array<{
    name: string;
    landmark: string | null;
    latitude: number;
    longitude: number;
    temperature: Quantity;
    precipitation: Quantity;
    snowfall: Quantity;
    weatherCode: number | null;
    status: RainStatus;
    temperatureDeltaFromCity: Quantity;
    precipitationDeltaFromCity: Quantity;
  }>;
  summary: string;
}

export interface WinterModule {
  snowAccumulation24h: Quantity;
  snowDepth: Quantity;
  blackIce: {
    score: number;
    level: "None" | "Watch" | "Hazard";
    roadTemperature: Quantity;
    roadTemperatureSource: "soil_temperature_0cm" | "air_temperature_proxy";
    dewPoint: Quantity;
    dewPointSpread: Quantity;
    active: boolean;
  };
  snowDayDelay: {
    probabilityPct: number;
    level: "Unlikely" | "Possible delay" | "Likely delay or closure";
  };
  frostbite: {
    windChill: Quantity;
    minutesUntilFrostbite: number | null;
    label: string;
  };
  summary: string;
}

export interface SummerModule {
  wbgt: Quantity;
  heatstrokeRisk: "Low" | "Moderate" | "High" | "Very High" | "Extreme";
  uvIndex: number | null;
  minutesToSunburn: number | null;
  sunburnBasis: "Fitzpatrick type II: 200 / UV index";
  pavementTemperature: Quantity;
  dogPawRisk: "Safe" | "Caution" | "Too hot for paws";
  peakAcWindow: {
    start: string;
    end: string;
    apparentTemperature: Quantity;
  } | null;
  summary: string;
}

export interface PipeAndFloodModule {
  pipeBurst: {
    level: "Safe" | "Watch" | "Critical Freeze Alert";
    consecutiveHoursAtOrBelowThreshold: number;
    upcomingHoursAtOrBelowThreshold: number;
    threshold: Quantity;
    soilTemperature: Quantity;
    windChill: Quantity;
  };
  sumpPump: {
    level: "Low" | "Elevated" | "High waterlogging risk";
    soilMoistureM3: number | null;
    rain24h: Quantity;
  };
  summary: string;
}

export interface RoofAndGutterModule {
  hailProbabilityPct: number;
  hailLevel: "Low" | "Possible" | "Likely";
  capeJkg: number | null;
  freezingLevel: Quantity;
  weatherCode: number | null;
  shingleUplift: {
    level: "Low" | "Moderate" | "High" | "Severe";
    gust: Quantity;
  };
  gutter: {
    roofAreaSqFt: 1500;
    runoffCoefficient: 0.95;
    rainRate: Quantity;
    flow: Quantity;
  };
  summary: string;
}

export interface PressureHealthModule {
  delta6h: Quantity;
  delta24h: Quantity;
  migraineRisk: "Stable" | "Moderate Drop" | "Moderate Rise" | "Severe Barometric Trigger";
  arthritisIndex: number;
  arthritisLevel: "Low" | "Moderate" | "High";
  safeOutdoorWindow: {
    safe: boolean;
    start: string | null;
    end: string | null;
    limitingFactor: string;
  };
  summary: string;
}

export interface CommuteModule {
  evRangeLossPct: number;
  tirePressurePsiDrop: number;
  tireFillReferenceF: 70;
  hydroplaning: {
    level: "Low" | "Caution" | "High" | "Severe";
    rainRate: Quantity;
  };
  laundryDryHours: number | null;
  laundryLabel: string;
  summary: string;
}

export interface StadiumModule {
  tossDelayProbabilityPct: number;
  dlsOversReductionRiskPct: number;
  outfieldRecoveryMinutes: number;
  drainageSystem: string;
  drainageBaseMinutes: number;
  coveredRoof: boolean;
  windDrift: {
    wind: Quantity;
    directionDeg: number | null;
    humiditySwingIndex: number;
    label: string;
  };
  summary: string;
}

const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const RAIN_CODES = new Set([61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const DRIZZLE_CODES = new Set([51, 53, 55, 56, 57]);
const FOG_CODES = new Set([45, 48]);

const FORECAST_CURRENT = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "is_day",
  "precipitation",
  "rain",
  "showers",
  "snowfall",
  "weather_code",
  "cloud_cover",
  "pressure_msl",
  "surface_pressure",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
].join(",");

const FORECAST_MINUTELY = ["precipitation", "snowfall", "weather_code", "wind_gusts_10m"].join(",");

const FORECAST_HOURLY = [
  "temperature_2m",
  "apparent_temperature",
  "precipitation_probability",
  "precipitation",
  "rain",
  "snowfall",
  "snow_depth",
  "surface_pressure",
  "cloud_cover",
  "visibility",
  "wind_speed_10m",
  "wind_gusts_10m",
  "uv_index",
  "soil_temperature_0cm",
  "soil_moisture_0_to_1cm",
  "freezing_level_height",
  "cape",
].join(",");

const AIR_VARS = ["us_aqi", "pm2_5", "pm10", "alder_pollen", "birch_pollen", "grass_pollen", "ragweed_pollen"].join(",");

const ROOF_M2 = 1500 * 0.09290304;
const ROOF_RUNOFF = 0.95;
const HOUR_MS = 3_600_000;

type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

interface ForecastResponse {
  timezone?: string;
  utc_offset_seconds?: number;
  current?: Record<string, unknown>;
  minutely_15?: { time?: string[] } & Record<string, unknown>;
  hourly?: { time?: string[] } & Record<string, unknown>;
}

interface AirResponse {
  utc_offset_seconds?: number;
  current?: Record<string, unknown>;
  hourly?: { time?: string[] } & Record<string, unknown>;
}

interface HourPoint {
  iso: string;
  timeMs: number;
  temperatureC: number | null;
  apparentC: number | null;
  precipProbability: number | null;
  precipitationMm: number | null;
  rainMm: number | null;
  showersMm: number | null;
  snowfallCm: number | null;
  snowDepthM: number | null;
  surfacePressureHpa: number | null;
  cloudCover: number | null;
  visibilityM: number | null;
  windKmh: number | null;
  gustKmh: number | null;
  uvIndex: number | null;
  soilTempC: number | null;
  soilMoisture: number | null;
  freezingLevelM: number | null;
  cape: number | null;
}

interface Slot {
  iso: string;
  timeMs: number;
  status: RainStatus;
}

interface AirPoint {
  iso: string;
  timeMs: number;
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  alder: number | null;
  birch: number | null;
  grass: number | null;
  ragweed: number | null;
}

interface CurrentSi {
  time: string;
  timeMs: number;
  temperatureC: number | null;
  apparentC: number | null;
  humidity: number | null;
  isDay: boolean;
  precipitationMm: number | null;
  rainMm: number | null;
  showersMm: number | null;
  snowfallCm: number | null;
  weatherCode: number | null;
  cloudCover: number | null;
  pressureMslHpa: number | null;
  surfacePressureHpa: number | null;
  windKmh: number | null;
  windDirectionDeg: number | null;
  gustKmh: number | null;
}

interface UnitHelpers {
  system: UnitSystem;
  temp: (celsius: number | null) => Quantity;
  deltaTemp: (celsius: number | null) => Quantity;
  speed: (kmh: number | null) => Quantity;
  rain: (mm: number | null, digits?: number) => Quantity;
  deltaRain: (mm: number | null) => Quantity;
  snow: (cm: number | null) => Quantity;
  pressure: (hpa: number | null) => Quantity;
  deltaPressure: (hpa: number | null) => Quantity;
  visibility: (meters: number | null) => Quantity;
  height: (meters: number | null) => Quantity;
  flow: (litersPerHour: number | null) => Quantity;
  depthFromMeters: (meters: number | null) => Quantity;
}

function round(value: number, digits: number): number {
  const p = 10 ** digits;
  return Math.round(value * p) / p;
}

function asNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function cToF(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function dewPointC(tempC: number, relativeHumidity: number): number {
  const rh = clamp(relativeHumidity, 1, 100);
  const a = 17.625;
  const b = 243.04;
  const gamma = Math.log(rh / 100) + (a * tempC) / (b + tempC);
  return (b * gamma) / (a - gamma);
}

export function windChillC(tempC: number, windKmh: number): number {
  const tempF = cToF(tempC);
  const windMph = windKmh * 0.621371;
  if (tempF > 50 || windMph < 3) return tempC;
  const wcF = 35.74 + 0.6215 * tempF - 35.75 * windMph ** 0.16 + 0.4275 * tempF * windMph ** 0.16;
  return ((wcF - 32) * 5) / 9;
}

export function frostbiteMinutes(windChillCValue: number): number | null {
  const wcF = cToF(windChillCValue);
  if (wcF > -15) return null;
  if (wcF > -18) return 30;
  if (wcF >= -33) return Math.round(30 + ((-18 - wcF) / 15) * -20);
  if (wcF >= -48) return Math.round(10 + ((-33 - wcF) / 15) * -5);
  return 5;
}

export function wetBulbGlobeC(tempC: number, relativeHumidity: number, uvIndex: number, cloudCover: number, isDay: boolean): number {
  const vaporHpa = (clamp(relativeHumidity, 0, 100) / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  let wbgt = 0.567 * tempC + 0.393 * vaporHpa + 3.94;
  if (isDay) {
    const sun = clamp(uvIndex / 11, 0, 1) * (1 - clamp(cloudCover, 0, 100) / 100);
    wbgt += sun * 4.5;
  }
  return wbgt;
}

export function pavementTempC(tempC: number, uvIndex: number, cloudCover: number, isDay: boolean): number {
  if (!isDay) return tempC - 1;
  const sun = clamp(uvIndex / 10, 0, 1) * (1 - clamp(cloudCover, 0, 100) / 100);
  return tempC + sun * 25;
}

export function evRangeLossPct(tempC: number): number {
  if (tempC <= 0) return round(Math.min(45, 15 + (0 - tempC) * 1.15), 1);
  if (tempC < 10) return round((10 - tempC) * 1.2, 1);
  if (tempC >= 30) return round(Math.min(30, (tempC - 27) * 1.6), 1);
  return 0;
}

export function tirePsiDrop(tempC: number): number {
  const tempF = cToF(tempC);
  return round(Math.max(0, (70 - tempF) / 10), 1);
}

export function hailProbabilityPct(cape: number, freezingLevelM: number, weatherCode: number): number {
  let p = 0;
  if (cape >= 400) p += 8;
  if (cape >= 1000) p += 14;
  if (cape >= 1800) p += 16;
  if (cape >= 2500) p += 14;
  if (freezingLevelM >= 1500 && freezingLevelM <= 4200) p += 18;
  else if (freezingLevelM >= 800 && freezingLevelM < 1500) p += 12;
  if (weatherCode === 96 || weatherCode === 99) p += 40;
  else if (weatherCode === 95) p += 22;
  else if (weatherCode >= 80 && weatherCode <= 82 && cape >= 800) p += 8;
  return clamp(Math.round(p), 0, 98);
}

export function drainageBaseMinutes(drainageSystem: string): number {
  const range = drainageSystem.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*min/i);
  if (range) return Number(range[2]);
  const single = drainageSystem.match(/(\d+)\s*min/i);
  if (single) return Number(single[1]);
  return 75;
}

export function rainStatus(precipMm: number, snowCm: number, weatherCode: number, step: "hour" | "quarter"): RainStatus {
  if (snowCm > 0 || SNOW_CODES.has(weatherCode)) return "YES — SNOWING NOW";
  const rainLine = step === "quarter" ? 0.15 : 0.5;
  const drizzleLine = step === "quarter" ? 0.02 : 0;
  if (RAIN_CODES.has(weatherCode) || precipMm >= rainLine) return "YES — RAINING NOW";
  if (DRIZZLE_CODES.has(weatherCode) || FOG_CODES.has(weatherCode) || precipMm > drizzleLine) {
    return "DRIZZLE / MIST NOW";
  }
  return "NO — DRY RIGHT NOW";
}

function unitsFor(system: UnitSystem): UnitHelpers {
  const imperial = system === "imperial";
  const windMph = system !== "metric";
  const tempUnit = imperial ? "°F" : "°C";
  const speedUnit = windMph ? "mph" : "km/h";
  const rainUnit = imperial ? "in" : "mm";
  const snowUnit = imperial ? "in" : "cm";
  const pressureUnit = imperial ? "inHg" : "hPa";

  const temp = (celsius: number | null): Quantity => ({
    value: celsius == null ? null : round(imperial ? cToF(celsius) : celsius, 1),
    unit: tempUnit,
  });

  return {
    system,
    temp,
    deltaTemp: (celsius) => ({
      value: celsius == null ? null : round(imperial ? (celsius * 9) / 5 : celsius, 1),
      unit: tempUnit,
    }),
    speed: (kmh) => ({
      value: kmh == null ? null : round(windMph ? kmh * 0.621371 : kmh, 1),
      unit: speedUnit,
    }),
    rain: (mm, digits = imperial ? 2 : 1) => ({
      value: mm == null ? null : round(imperial ? mm / 25.4 : mm, digits),
      unit: rainUnit,
    }),
    deltaRain: (mm) => ({
      value: mm == null ? null : round(imperial ? mm / 25.4 : mm, imperial ? 2 : 1),
      unit: rainUnit,
    }),
    snow: (cm) => ({
      value: cm == null ? null : round(imperial ? cm / 2.54 : cm, imperial ? 2 : 1),
      unit: snowUnit,
    }),
    pressure: (hpa) => ({
      value: hpa == null ? null : round(imperial ? hpa * 0.02953 : hpa, imperial ? 2 : 1),
      unit: pressureUnit,
    }),
    deltaPressure: (hpa) => ({
      value: hpa == null ? null : round(imperial ? hpa * 0.02953 : hpa, imperial ? 2 : 1),
      unit: pressureUnit,
    }),
    visibility: (meters) => ({
      value: meters == null ? null : round(imperial ? meters / 1609.344 : meters / 1000, 1),
      unit: imperial ? "mi" : "km",
    }),
    height: (meters) => ({
      value: meters == null ? null : round(imperial ? meters * 3.28084 : meters, 0),
      unit: imperial ? "ft" : "m",
    }),
    flow: (litersPerHour) => ({
      value: litersPerHour == null ? null : round(imperial ? litersPerHour * 0.264172 : litersPerHour, 0),
      unit: imperial ? "gal/h" : "L/h",
    }),
    depthFromMeters: (meters) => ({
      value: meters == null ? null : round(imperial ? (meters * 100) / 2.54 : meters * 100, imperial ? 2 : 1),
      unit: snowUnit,
    }),
  };
}

export function parseApiTime(iso: string, utcOffsetSeconds: number): number {
  if (/(?:z|Z|[+-]\d{2}:\d{2})$/.test(iso)) {
    const parsed = Date.parse(iso);
    if (Number.isNaN(parsed)) throw new WeatherEngineError(`Unparseable Open-Meteo time ${iso}`);
    return parsed;
  }
  const withSeconds = iso.length === 16 ? `${iso}:00Z` : `${iso}Z`;
  const parsed = Date.parse(withSeconds);
  if (Number.isNaN(parsed)) throw new WeatherEngineError(`Unparseable Open-Meteo time ${iso}`);
  return parsed - utcOffsetSeconds * 1000;
}

function localLabel(iso: string): string {
  const match = iso.match(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? `${match[1]} ${match[2]}` : iso;
}

function qtyText(q: Quantity, digits = 1): string {
  if (q.value == null) return `n/a ${q.unit}`;
  return `${q.value.toFixed(digits)} ${q.unit}`;
}

function assertCoords(latitude: number, longitude: number): void {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new WeatherEngineError("Latitude must be between -90 and 90");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new WeatherEngineError("Longitude must be between -180 and 180");
  }
}

function seriesNumbers(block: { time?: string[] } & Record<string, unknown>, key: string): Array<number | null> {
  const values = block[key];
  if (!Array.isArray(block.time) || !Array.isArray(values) || values.length !== block.time.length) {
    throw new WeatherEngineError(`Open-Meteo series ${key} is missing or misaligned`);
  }
  return values.map(asNumber);
}

function optionalSeries(block: { time?: string[] } & Record<string, unknown>, key: string): Array<number | null> {
  if (!Array.isArray(block.time)) return [];
  if (!Array.isArray(block[key])) return block.time.map(() => null);
  return seriesNumbers(block, key);
}

function buildForecastUrl(latitude: number, longitude: number, timezone: string): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: FORECAST_CURRENT,
    minutely_15: FORECAST_MINUTELY,
    hourly: FORECAST_HOURLY,
    past_days: "1",
    forecast_days: "3",
    forecast_minutely_15: "24",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timezone: timezone || "auto",
    cell_selection: "nearest",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function buildAirUrl(latitude: number, longitude: number, timezone: string): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: AIR_VARS,
    hourly: AIR_VARS,
    past_days: "1",
    forecast_days: "3",
    timezone: timezone || "auto",
    cell_selection: "nearest",
  });
  return `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
}

function buildNeighborhoodUrl(neighborhoods: NeighborhoodInput[], timezone: string): string {
  const params = new URLSearchParams({
    latitude: neighborhoods.map((item) => item.lat).join(","),
    longitude: neighborhoods.map((item) => item.lng).join(","),
    current: "temperature_2m,precipitation,rain,showers,snowfall,weather_code",
    temperature_unit: "celsius",
    precipitation_unit: "mm",
    timezone: timezone || "auto",
    cell_selection: "nearest",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const init: RequestInit = process.env.NEXT_RUNTIME
    ? ({ next: { revalidate: 900 } } as NextFetchInit)
    : {};
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text();
    throw new WeatherEngineError(`Open-Meteo ${response.status} for ${url.split("?")[0]}: ${body.slice(0, 280)}`);
  }
  return (await response.json()) as T;
}

function requireCurrent(forecast: ForecastResponse): Record<string, unknown> {
  if (!forecast.current || typeof forecast.current.time !== "string") {
    throw new WeatherEngineError("Open-Meteo forecast did not include current conditions");
  }
  return forecast.current;
}

function parseHours(forecast: ForecastResponse, offset: number): HourPoint[] {
  const hourly = forecast.hourly;
  if (!hourly?.time?.length) throw new WeatherEngineError("Open-Meteo forecast did not include hourly data");
  const temperature = seriesNumbers(hourly, "temperature_2m");
  const apparent = seriesNumbers(hourly, "apparent_temperature");
  const pop = seriesNumbers(hourly, "precipitation_probability");
  const precipitation = seriesNumbers(hourly, "precipitation");
  const rain = seriesNumbers(hourly, "rain");
  const snowfall = seriesNumbers(hourly, "snowfall");
  const snowDepth = seriesNumbers(hourly, "snow_depth");
  const pressure = seriesNumbers(hourly, "surface_pressure");
  const cloud = seriesNumbers(hourly, "cloud_cover");
  const visibility = seriesNumbers(hourly, "visibility");
  const wind = seriesNumbers(hourly, "wind_speed_10m");
  const gust = seriesNumbers(hourly, "wind_gusts_10m");
  const uv = seriesNumbers(hourly, "uv_index");
  const soil = seriesNumbers(hourly, "soil_temperature_0cm");
  const moisture = seriesNumbers(hourly, "soil_moisture_0_to_1cm");
  const freezing = seriesNumbers(hourly, "freezing_level_height");
  const cape = seriesNumbers(hourly, "cape");

  return hourly.time.map((iso, index) => ({
    iso,
    timeMs: parseApiTime(iso, offset),
    temperatureC: temperature[index],
    apparentC: apparent[index],
    precipProbability: pop[index],
    precipitationMm: precipitation[index],
    rainMm: rain[index],
    showersMm: null,
    snowfallCm: snowfall[index],
    snowDepthM: snowDepth[index],
    surfacePressureHpa: pressure[index],
    cloudCover: cloud[index],
    visibilityM: visibility[index],
    windKmh: wind[index],
    gustKmh: gust[index],
    uvIndex: uv[index],
    soilTempC: soil[index],
    soilMoisture: moisture[index],
    freezingLevelM: freezing[index],
    cape: cape[index],
  }));
}

function parseSlots(forecast: ForecastResponse, offset: number, hours: HourPoint[]): { slots: Slot[]; resolution: 15 | 60 } {
  const block = forecast.minutely_15;
  if (block?.time?.length) {
    const precip = seriesNumbers(block, "precipitation");
    const snow = seriesNumbers(block, "snowfall");
    const codes = seriesNumbers(block, "weather_code");
    return {
      resolution: 15,
      slots: block.time.map((iso, index) => ({
        iso,
        timeMs: parseApiTime(iso, offset),
        status: rainStatus(precip[index] ?? 0, snow[index] ?? 0, codes[index] ?? 0, "quarter"),
      })),
    };
  }

  return {
    resolution: 60,
    slots: hours.map((hour) => ({
      iso: hour.iso,
      timeMs: hour.timeMs,
      status: rainStatus(hour.precipitationMm ?? 0, hour.snowfallCm ?? 0, 0, "hour"),
    })),
  };
}

function parseAir(air: AirResponse | null, offset: number): { current: AirResponse["current"]; hours: AirPoint[] } {
  if (!air?.hourly?.time?.length) return { current: air?.current, hours: [] };
  const usAqi = seriesNumbers(air.hourly, "us_aqi");
  const pm25 = seriesNumbers(air.hourly, "pm2_5");
  const pm10 = seriesNumbers(air.hourly, "pm10");
  const alder = optionalSeries(air.hourly, "alder_pollen");
  const birch = optionalSeries(air.hourly, "birch_pollen");
  const grass = optionalSeries(air.hourly, "grass_pollen");
  const ragweed = optionalSeries(air.hourly, "ragweed_pollen");
  return {
    current: air.current,
    hours: air.hourly.time.map((iso, index) => ({
      iso,
      timeMs: parseApiTime(iso, air.utc_offset_seconds ?? offset),
      usAqi: usAqi[index],
      pm25: pm25[index],
      pm10: pm10[index],
      alder: alder[index],
      birch: birch[index],
      grass: grass[index],
      ragweed: ragweed[index],
    })),
  };
}

function nearestAtOrBefore<T extends { timeMs: number }>(points: T[], nowMs: number): T | null {
  let best: T | null = null;
  for (const point of points) {
    if (point.timeMs <= nowMs + 60_000 && (best == null || point.timeMs > best.timeMs)) best = point;
  }
  return best;
}

function liquidMm(hour: HourPoint): number | null {
  if (hour.precipitationMm != null) {
    const snowWater = (hour.snowfallCm ?? 0) / 7;
    return Math.max(0, hour.precipitationMm - snowWater);
  }
  if (hour.rainMm == null) return null;
  return hour.rainMm + (hour.showersMm ?? 0);
}

function sumWindow(hours: HourPoint[], nowMs: number, hoursBack: number, pick: (hour: HourPoint) => number | null): number | null {
  const start = nowMs - hoursBack * HOUR_MS;
  const values: number[] = [];
  for (const hour of hours) {
    if (hour.timeMs > start && hour.timeMs <= nowMs + 60_000) {
      const value = pick(hour);
      if (value != null) values.push(value);
    }
  }
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

function valueNear(hours: HourPoint[], targetMs: number, pick: (hour: HourPoint) => number | null): number | null {
  let best: HourPoint | null = null;
  let bestDistance = Infinity;
  for (const hour of hours) {
    const distance = Math.abs(hour.timeMs - targetMs);
    if (distance < bestDistance && distance <= 90 * 60 * 1000) {
      best = hour;
      bestDistance = distance;
    }
  }
  return best ? pick(best) : null;
}

function analyzeTimer(status: RainStatus, slots: Slot[], nowMs: number, resolution: 15 | 60): Pick<MinuteTimer, "change" | "minutesUntilChange" | "nextDryWindowMinutes"> {
  const future = slots.filter((slot) => slot.timeMs > nowMs).sort((a, b) => a.timeMs - b.timeMs);
  const wetNow = status !== "NO — DRY RIGHT NOW";
  const windowEnd = nowMs + 6 * HOUR_MS;
  const inWindow = future.filter((slot) => slot.timeMs <= windowEnd);
  const fallbackStep = resolution;

  if (inWindow.length === 0) {
    return {
      change: "persists",
      minutesUntilChange: null,
      nextDryWindowMinutes: wetNow ? 0 : 360,
    };
  }

  if (!wetNow) {
    const start = inWindow.find((slot) => slot.status !== "NO — DRY RIGHT NOW");
    if (!start) {
      const last = inWindow[inWindow.length - 1];
      return {
        change: "persists",
        minutesUntilChange: null,
        nextDryWindowMinutes: Math.max(0, Math.round((last.timeMs - nowMs) / 60_000)),
      };
    }
    const minutes = Math.max(0, Math.round((start.timeMs - nowMs) / 60_000));
    return { change: "starts", minutesUntilChange: minutes, nextDryWindowMinutes: minutes };
  }

  const stop = inWindow.find((slot) => slot.status === "NO — DRY RIGHT NOW");
  if (!stop) {
    return { change: "persists", minutesUntilChange: null, nextDryWindowMinutes: 0 };
  }
  const minutes = Math.max(0, Math.round((stop.timeMs - nowMs) / 60_000));
  let dry = 0;
  const stopIndex = inWindow.indexOf(stop);
  for (let index = stopIndex; index < inWindow.length; index += 1) {
    if (inWindow[index].status !== "NO — DRY RIGHT NOW") break;
    const next = inWindow[index + 1];
    dry += next ? (next.timeMs - inWindow[index].timeMs) / 60_000 : fallbackStep;
  }
  return { change: "stops", minutesUntilChange: minutes, nextDryWindowMinutes: Math.round(dry) };
}

function phenomenon(status: RainStatus): string {
  if (status === "YES — SNOWING NOW") return "Snow";
  if (status === "YES — RAINING NOW") return "Rain";
  if (status === "DRIZZLE / MIST NOW") return "Drizzle";
  return "Dry weather";
}

function heatstrokeRisk(wbgtC: number): SummerModule["heatstrokeRisk"] {
  if (wbgtC >= 32.2) return "Extreme";
  if (wbgtC >= 31.1) return "Very High";
  if (wbgtC >= 29.5) return "High";
  if (wbgtC >= 27.8) return "Moderate";
  return "Low";
}

function dogPawRisk(pavementC: number): SummerModule["dogPawRisk"] {
  if (pavementC >= 52) return "Too hot for paws";
  if (pavementC >= 43) return "Caution";
  return "Safe";
}

function coldRun(hours: HourPoint[], nowMs: number, origin: "current" | "upcoming"): number {
  const points = hours
    .filter((hour) => hour.temperatureC != null && hour.timeMs >= nowMs - HOUR_MS && hour.timeMs <= nowMs + 48 * HOUR_MS)
    .sort((a, b) => a.timeMs - b.timeMs);
  const cold = (hour: HourPoint) => (hour.temperatureC ?? 99) <= -2;
  const contiguous = (index: number) => {
    let start = index;
    while (start > 0 && cold(points[start - 1]) && points[start].timeMs - points[start - 1].timeMs <= 90 * 60 * 1000) start -= 1;
    let end = index;
    while (end < points.length - 1 && cold(points[end + 1]) && points[end + 1].timeMs - points[end].timeMs <= 90 * 60 * 1000) end += 1;
    return end - start + 1;
  };

  if (origin === "current") {
    let index = -1;
    for (let cursor = 0; cursor < points.length; cursor += 1) {
      if (points[cursor].timeMs <= nowMs + 60_000) index = cursor;
    }
    if (index < 0 || !cold(points[index])) return 0;
    return contiguous(index);
  }

  const upcoming = points.find((hour) => hour.timeMs > nowMs && hour.timeMs <= nowMs + 12 * HOUR_MS && cold(hour));
  if (!upcoming) return 0;
  return contiguous(points.indexOf(upcoming));
}

function shingleLevel(gustKmh: number): RoofAndGutterModule["shingleUplift"]["level"] {
  const mph = gustKmh * 0.621371;
  if (mph >= 70) return "Severe";
  if (mph >= 55) return "High";
  if (mph >= 40) return "Moderate";
  return "Low";
}

function migraineRisk(delta6h: number, delta24h: number | null): PressureHealthModule["migraineRisk"] {
  const severe = Math.abs(delta6h) >= 5 || (delta24h != null && Math.abs(delta24h) >= 5);
  if (severe) return "Severe Barometric Trigger";
  const delta = Math.abs(delta6h) >= Math.abs(delta24h ?? 0) ? delta6h : (delta24h ?? delta6h);
  if (Math.abs(delta) < 2) return "Stable";
  return delta < 0 ? "Moderate Drop" : "Moderate Rise";
}

function coveredRoof(roofType: string | null | undefined): boolean {
  if (!roofType) return false;
  return /dome|fixed roof|closed roof|retractable closed/i.test(roofType) && !/open air/i.test(roofType);
}

function buildMinuteTimer(
  status: RainStatus,
  slots: Slot[],
  nowMs: number,
  resolution: 15 | 60,
  hours: HourPoint[],
  units: UnitHelpers,
): MinuteTimer {
  const timing = analyzeTimer(status, slots, nowMs, resolution);
  const past6hRain = units.rain(sumWindow(hours, nowMs, 6, liquidMm));
  const past24hRain = units.rain(sumWindow(hours, nowMs, 24, liquidMm));
  const past6hSnow = units.snow(sumWindow(hours, nowMs, 6, (hour) => hour.snowfallCm));
  const past24hSnow = units.snow(sumWindow(hours, nowMs, 24, (hour) => hour.snowfallCm));
  const name = phenomenon(status);
  let changeText = `${name} holds through the next 6 hours.`;
  if (timing.change === "starts" && timing.minutesUntilChange != null) {
    changeText = `${name === "Dry weather" ? "Precipitation" : name} starts in ${timing.minutesUntilChange} minutes.`;
  } else if (timing.change === "stops" && timing.minutesUntilChange != null) {
    changeText = `${name} stops in ${timing.minutesUntilChange} minutes.`;
  }
  const dryText =
    timing.nextDryWindowMinutes == null
      ? ""
      : ` Next dry window: ${timing.nextDryWindowMinutes} minutes.`;
  return {
    status,
    ...timing,
    resolutionMinutes: resolution,
    past6hRain,
    past24hRain,
    past6hSnow,
    past24hSnow,
    summary: `${status}. ${changeText}${dryText} Past 6 hours ${qtyText(past6hRain)} rain and ${qtyText(past6hSnow)} snow. Past 24 hours ${qtyText(past24hRain)} rain and ${qtyText(past24hSnow)} snow.`,
  };
}

function buildWinter(
  current: CurrentSi,
  hours: HourPoint[],
  nowMs: number,
  timer: MinuteTimer,
  units: UnitHelpers,
): WinterModule {
  const hour = nearestAtOrBefore(hours, nowMs);
  const tempC = current.temperatureC ?? hour?.temperatureC ?? 0;
  const humidity = current.humidity ?? 50;
  const dew = dewPointC(tempC, humidity);
  const soil = hour?.soilTempC ?? null;
  const roadC = soil ?? tempC;
  const spread = tempC - dew;
  const moisture = hour?.soilMoisture ?? 0;
  const recentWet = (sumWindow(hours, nowMs, 6, (item) => item.precipitationMm) ?? 0) > 0.2;
  const active = roadC <= 0 && (spread <= 2 || moisture >= 0.2 || recentWet || (current.precipitationMm ?? 0) > 0);
  let score = 0;
  if (active) {
    score = 55;
    if (spread <= 1) score += 15;
    if (moisture >= 0.35) score += 10;
    if ((current.precipitationMm ?? 0) > 0 || recentWet) score += 15;
    if ((current.windKmh ?? 0) >= 20) score += 5;
    score = clamp(score, 55, 100);
  } else if (roadC <= 2) {
    score = clamp(Math.round((2 - roadC) * 8 + (spread <= 3 ? 6 : 0)), 0, 24);
  }
  const level: WinterModule["blackIce"]["level"] = score >= 55 ? "Hazard" : score >= 25 ? "Watch" : "None";
  const snow24cm = sumWindow(hours, nowMs, 24, (item) => item.snowfallCm) ?? 0;
  let delay = 0;
  if (snow24cm >= 1) delay += 15;
  if (snow24cm >= 2.5) delay += 20;
  if (snow24cm >= 8) delay += 20;
  if (snow24cm >= 15) delay += 15;
  if (timer.status === "YES — SNOWING NOW") delay += 15;
  if (tempC <= -8) delay += 8;
  if ((current.gustKmh ?? 0) >= 50 && (timer.status === "YES — SNOWING NOW" || snow24cm >= 1)) delay += 10;
  delay = clamp(delay, 0, 95);
  const delayLevel: WinterModule["snowDayDelay"]["level"] =
    delay >= 55 ? "Likely delay or closure" : delay >= 25 ? "Possible delay" : "Unlikely";
  const chill = windChillC(tempC, current.windKmh ?? 0);
  const frostMinutes = frostbiteMinutes(chill);
  const windChillQ = units.temp(chill);
  const frostLabel =
    frostMinutes == null
      ? `Wind chill ${qtyText(windChillQ)} is outside the frostbite-timer range.`
      : `Exposed skin can reach frostbite in about ${frostMinutes} minutes at wind chill ${qtyText(windChillQ)}.`;

  return {
    snowAccumulation24h: units.snow(snow24cm),
    snowDepth: units.depthFromMeters(hour?.snowDepthM ?? null),
    blackIce: {
      score,
      level,
      roadTemperature: units.temp(roadC),
      roadTemperatureSource: soil == null ? "air_temperature_proxy" : "soil_temperature_0cm",
      dewPoint: units.temp(dew),
      dewPointSpread: units.deltaTemp(spread),
      active,
    },
    snowDayDelay: { probabilityPct: delay, level: delayLevel },
    frostbite: { windChill: windChillQ, minutesUntilFrostbite: frostMinutes, label: frostLabel },
    summary: `24-hour snow ${qtyText(units.snow(snow24cm))}. Black ice ${level} (${score}/100) with road temperature ${qtyText(units.temp(roadC))}. Snow-day delay probability ${delay}%. ${frostLabel}`,
  };
}

function buildSummer(current: CurrentSi, hours: HourPoint[], nowMs: number, units: UnitHelpers): SummerModule {
  const hour = nearestAtOrBefore(hours, nowMs);
  const tempC = current.temperatureC ?? hour?.temperatureC ?? 0;
  const humidity = current.humidity ?? 50;
  const uv = hour?.uvIndex ?? 0;
  const cloud = current.cloudCover ?? hour?.cloudCover ?? 0;
  const wbgt = wetBulbGlobeC(tempC, humidity, uv, cloud, current.isDay);
  const pavement = pavementTempC(tempC, uv, cloud, current.isDay);
  const burn = !current.isDay || uv < 1 ? null : Math.max(1, Math.round(200 / uv));
  const future = hours
    .filter((item) => item.timeMs >= nowMs - 30 * 60 * 1000 && item.timeMs <= nowMs + 24 * HOUR_MS && item.apparentC != null)
    .sort((a, b) => a.timeMs - b.timeMs);
  let peak: { start: HourPoint; end: HourPoint; mean: number } | null = null;
  for (let index = 0; index + 2 < future.length; index += 1) {
    const slice = future.slice(index, index + 3);
    if (slice[2].timeMs - slice[0].timeMs > 3.5 * HOUR_MS) continue;
    const mean = slice.reduce((sum, item) => sum + (item.apparentC ?? 0), 0) / 3;
    if (!peak || mean > peak.mean) peak = { start: slice[0], end: slice[2], mean };
  }
  const risk = heatstrokeRisk(wbgt);
  const paws = dogPawRisk(pavement);
  const peakWindow = peak
    ? {
        start: localLabel(peak.start.iso),
        end: localLabel(peak.end.iso),
        apparentTemperature: units.temp(peak.mean),
      }
    : null;
  return {
    wbgt: units.temp(wbgt),
    heatstrokeRisk: risk,
    uvIndex: hour?.uvIndex ?? null,
    minutesToSunburn: burn,
    sunburnBasis: "Fitzpatrick type II: 200 / UV index",
    pavementTemperature: units.temp(pavement),
    dogPawRisk: paws,
    peakAcWindow: peakWindow,
    summary: `WBGT ${qtyText(units.temp(wbgt))}, heatstroke risk ${risk}. ${burn == null ? `UV ${uv.toFixed(1)} is too low for a sunburn timer.` : `UV ${uv.toFixed(1)} burns Fitzpatrick II skin in about ${burn} minutes.`} Pavement ${qtyText(units.temp(pavement))} (${paws}).${peakWindow ? ` Peak AC load ${peakWindow.start} to ${peakWindow.end} at ${qtyText(peakWindow.apparentTemperature)} feels-like.` : ""}`,
  };
}

function buildPipe(current: CurrentSi, hours: HourPoint[], nowMs: number, units: UnitHelpers): PipeAndFloodModule {
  const hour = nearestAtOrBefore(hours, nowMs);
  const tempC = current.temperatureC ?? hour?.temperatureC ?? 0;
  const currentRun = coldRun(hours, nowMs, "current");
  const upcomingRun = coldRun(hours, nowMs, "upcoming");
  const soil = hour?.soilTempC ?? null;
  const chill = windChillC(tempC, current.windKmh ?? 0);
  let level: PipeAndFloodModule["pipeBurst"]["level"] = "Safe";
  if (currentRun >= 7 || (currentRun >= 4 && soil != null && soil <= -2) || (upcomingRun >= 8 && currentRun === 0)) {
    level = "Critical Freeze Alert";
  } else if (currentRun >= 3 || upcomingRun >= 4 || (soil != null && soil <= 0 && tempC <= 0)) {
    level = "Watch";
  }
  if (level === "Watch" && chill <= -15 && currentRun >= 3) level = "Critical Freeze Alert";

  const rain24 = sumWindow(hours, nowMs, 24, liquidMm);
  const moisture = hour?.soilMoisture ?? null;
  let sump: PipeAndFloodModule["sumpPump"]["level"] = "Low";
  if ((moisture != null && moisture >= 0.42 && (rain24 ?? 0) >= 20) || (rain24 ?? 0) >= 40) sump = "High waterlogging risk";
  else if ((moisture != null && moisture >= 0.32 && (rain24 ?? 0) >= 8) || (rain24 ?? 0) >= 20) sump = "Elevated";

  const rainQ = units.rain(rain24);
  return {
    pipeBurst: {
      level,
      consecutiveHoursAtOrBelowThreshold: currentRun,
      upcomingHoursAtOrBelowThreshold: upcomingRun,
      threshold: units.temp(-2),
      soilTemperature: units.temp(soil),
      windChill: units.temp(chill),
    },
    sumpPump: { level: sump, soilMoistureM3: moisture, rain24h: rainQ },
    summary: `Pipe burst ${level}: ${currentRun} consecutive hours at or below ${qtyText(units.temp(-2))}, soil ${qtyText(units.temp(soil))}. Sump-pump waterlogging ${sump} after ${qtyText(rainQ)} of rain in 24 hours.`,
  };
}

function buildRoof(current: CurrentSi, hours: HourPoint[], nowMs: number, units: UnitHelpers): RoofAndGutterModule {
  const hour = nearestAtOrBefore(hours, nowMs);
  const cape = hour?.cape ?? 0;
  const freezing = hour?.freezingLevelM ?? 0;
  const code = current.weatherCode ?? 0;
  const hail = hour?.cape == null || hour?.freezingLevelM == null ? 0 : hailProbabilityPct(cape, freezing, code);
  const hailLevel: RoofAndGutterModule["hailLevel"] = hail >= 50 ? "Likely" : hail >= 20 ? "Possible" : "Low";
  const gust = current.gustKmh ?? hour?.gustKmh ?? 0;
  const uplift = shingleLevel(gust);
  const hourlyRate = hour?.precipitationMm ?? current.precipitationMm ?? 0;
  const rainRate = Math.max(hourlyRate, current.precipitationMm ?? 0);
  const liters = rainRate * ROOF_M2 * ROOF_RUNOFF;
  const flow = units.flow(liters);
  const rainQ = units.rain(rainRate);
  return {
    hailProbabilityPct: hail,
    hailLevel,
    capeJkg: hour?.cape ?? null,
    freezingLevel: units.height(hour?.freezingLevelM ?? null),
    weatherCode: current.weatherCode,
    shingleUplift: { level: uplift, gust: units.speed(gust) },
    gutter: { roofAreaSqFt: 1500, runoffCoefficient: 0.95, rainRate: rainQ, flow },
    summary: `Hail probability ${hail}% (${hailLevel}) from CAPE ${Math.round(cape)} J/kg and freezing level ${qtyText(units.height(hour?.freezingLevelM ?? null), 0)}. Shingle uplift ${uplift} at ${qtyText(units.speed(gust))} gusts. A 1,500 sq ft roof sheds about ${qtyText(flow, 0)} at the current rain rate.`,
  };
}

function pollenSum(point: AirPoint | undefined): number {
  if (!point) return 0;
  return (point.alder ?? 0) + (point.birch ?? 0) + (point.grass ?? 0) + (point.ragweed ?? 0);
}

function buildPressure(
  current: CurrentSi,
  hours: HourPoint[],
  airHours: AirPoint[],
  nowMs: number,
  units: UnitHelpers,
): PressureHealthModule {
  const nowPressure = current.surfacePressureHpa ?? valueNear(hours, nowMs, (hour) => hour.surfacePressureHpa);
  const pressure6 = valueNear(hours, nowMs - 6 * HOUR_MS, (hour) => hour.surfacePressureHpa);
  const pressure24 = valueNear(hours, nowMs - 24 * HOUR_MS, (hour) => hour.surfacePressureHpa);
  const delta6 = nowPressure != null && pressure6 != null ? nowPressure - pressure6 : null;
  const delta24 = nowPressure != null && pressure24 != null ? nowPressure - pressure24 : null;
  const migraine = delta6 == null ? "Stable" : migraineRisk(delta6, delta24);
  const humidity = current.humidity ?? 50;
  const drop = delta6 != null && delta6 < 0 ? clamp(Math.abs(delta6) * 8, 0, 50) : 0;
  const arthritis = clamp(Math.round(clamp((humidity - 50) * 1.2, 0, 50) + drop), 0, 100);
  const arthritisLevel: PressureHealthModule["arthritisLevel"] = arthritis >= 60 ? "High" : arthritis >= 30 ? "Moderate" : "Low";

  const airByKey = new Map(airHours.map((point) => [point.iso.slice(0, 16), point]));
  const future = hours
    .filter((hour) => hour.timeMs > nowMs && hour.timeMs <= nowMs + 36 * HOUR_MS)
    .sort((a, b) => a.timeMs - b.timeMs);
  const safeFlags = future.map((hour) => {
    const air = airByKey.get(hour.iso.slice(0, 16));
    const aqi = air?.usAqi;
    const pm = air?.pm25;
    const airOk = aqi != null ? aqi <= 50 : pm == null || pm <= 12;
    const pollenOk = pollenSum(air) < 30;
    const dry = (hour.precipProbability ?? 0) < 40 && (hour.precipitationMm ?? 0) < 0.2;
    const tempOk = hour.temperatureC != null && hour.temperatureC >= 5 && hour.temperatureC <= 32;
    const windOk = (hour.windKmh ?? 0) < 40;
    return { hour, safe: airOk && pollenOk && dry && tempOk && windOk, airOk, pollenOk, dry };
  });

  let best: { start: number; length: number } | null = null;
  let runStart = -1;
  for (let index = 0; index <= safeFlags.length; index += 1) {
    const open = index < safeFlags.length && safeFlags[index].safe;
    if (open && runStart < 0) runStart = index;
    if (!open && runStart >= 0) {
      const length = index - runStart;
      if (!best || length > best.length) best = { start: runStart, length };
      runStart = -1;
    }
  }

  let window: PressureHealthModule["safeOutdoorWindow"];
  if (best && best.length >= 2) {
    const start = safeFlags[best.start].hour;
    const end = safeFlags[best.start + best.length - 1].hour;
    window = {
      safe: true,
      start: localLabel(start.iso),
      end: localLabel(end.iso),
      limitingFactor: "US AQI good, pollen low, and no rain in this window",
    };
  } else {
    const ranked = [...safeFlags].sort((a, b) => Number(b.airOk) - Number(a.airOk) || Number(b.dry) - Number(a.dry));
    const pick = ranked[0];
    window = {
      safe: false,
      start: pick ? localLabel(pick.hour.iso) : null,
      end: pick ? localLabel(pick.hour.iso) : null,
      limitingFactor: pick
        ? pick.airOk
          ? pick.dry
            ? "Temperature, wind, or pollen keeps a longer outdoor window from opening"
            : "Rain or a high precipitation probability"
          : "US AQI or PM2.5"
        : "No hourly air-quality sample in the next 36 hours",
    };
  }

  const delta6Q = units.deltaPressure(delta6);
  const delta24Q = units.deltaPressure(delta24);
  return {
    delta6h: delta6Q,
    delta24h: delta24Q,
    migraineRisk: migraine,
    arthritisIndex: arthritis,
    arthritisLevel,
    safeOutdoorWindow: window,
    summary: `Pressure change ${qtyText(delta6Q, 2)} over 6 hours and ${qtyText(delta24Q, 2)} over 24 hours. Migraine/sinus risk: ${migraine}. Arthritis flare index ${arthritis}/100 (${arthritisLevel}).`,
  };
}

function buildCommute(current: CurrentSi, hours: HourPoint[], nowMs: number, units: UnitHelpers): CommuteModule {
  const hour = nearestAtOrBefore(hours, nowMs);
  const tempC = current.temperatureC ?? hour?.temperatureC ?? 0;
  const loss = evRangeLossPct(tempC);
  const psi = tirePsiDrop(tempC);
  const rainRate = Math.max(hour?.precipitationMm ?? 0, current.precipitationMm ?? 0);
  let hydro: CommuteModule["hydroplaning"]["level"] = "Low";
  if (rainRate >= 15) hydro = "Severe";
  else if (rainRate >= 7.6) hydro = "High";
  else if (rainRate >= 2) hydro = "Caution";
  else if (rainRate > 0) hydro = "Caution";
  const pop = hour?.precipProbability ?? 0;
  const raining = rainRate > 0.2 || current.weatherCode != null && RAIN_CODES.has(current.weatherCode);
  let laundry: number | null = null;
  let laundryLabel = "Outdoor drying is a poor bet while precipitation is falling or likely.";
  if (!raining && pop < 50) {
    let hoursToDry = 5.5;
    hoursToDry += Math.max(0, (current.humidity ?? 60) - 45) * 0.06;
    hoursToDry -= Math.min(2.5, (current.windKmh ?? 0) * 0.04);
    if (current.isDay && (current.cloudCover ?? 100) < 40 && (hour?.uvIndex ?? 0) >= 3) hoursToDry -= 1.5;
    if (tempC < 8) hoursToDry += 3;
    else if (tempC > 26) hoursToDry -= 1;
    laundry = round(clamp(hoursToDry, 1.5, 16), 1);
    laundryLabel = `A standard outdoor load dries in about ${laundry} hours.`;
  }
  return {
    evRangeLossPct: loss,
    tirePressurePsiDrop: psi,
    tireFillReferenceF: 70,
    hydroplaning: { level: hydro, rainRate: units.rain(rainRate) },
    laundryDryHours: laundry,
    laundryLabel,
    summary: `EV range loss about ${loss}% at ${qtyText(units.temp(tempC))}. Cold tire-pressure drop ${psi} PSI from a 70°F fill. Two-wheeler/hydroplaning risk ${hydro}. ${laundryLabel}`,
  };
}

function buildStadium(
  stadium: StadiumInput,
  current: CurrentSi,
  hours: HourPoint[],
  nowMs: number,
  timer: MinuteTimer,
  units: UnitHelpers,
): StadiumModule {
  const covered = coveredRoof(stadium.roofType);
  const hour = nearestAtOrBefore(hours, nowMs);
  const rainRate = Math.max(hour?.precipitationMm ?? 0, current.precipitationMm ?? 0);
  const nextHours = hours.filter((item) => item.timeMs > nowMs && item.timeMs <= nowMs + 8 * HOUR_MS);
  const wetHours = nextHours.filter((item) => (item.precipitationMm ?? 0) > 0.3 || (item.precipProbability ?? 0) >= 60).length;
  let toss = covered ? 5 : 8;
  if (!covered && timer.status !== "NO — DRY RIGHT NOW") toss = clamp(60 + rainRate * 4, 60, 98);
  else if (!covered) {
    const maxPop = nextHours.slice(0, 3).reduce((max, item) => Math.max(max, item.precipProbability ?? 0), 0);
    toss = clamp(Math.round(maxPop * 0.85), toss, 90);
  }
  let dls = covered ? 0 : clamp(Math.round((wetHours / Math.max(nextHours.length, 1)) * 100), 0, 98);
  if (!covered && timer.status === "YES — RAINING NOW") dls = Math.max(dls, 40);

  const past6 = sumWindow(hours, nowMs, 6, (item) => item.precipitationMm) ?? 0;
  const base = drainageBaseMinutes(stadium.drainageSystem);
  const rapid = /subair|vacuum|rapid/i.test(stadium.drainageSystem);
  let recovery = 0;
  if (!covered && (timer.status !== "NO — DRY RIGHT NOW" || past6 >= 0.2)) {
    const untilStop = timer.status !== "NO — DRY RIGHT NOW" ? (timer.minutesUntilChange ?? 90) : 0;
    recovery = Math.round(untilStop + base + past6 * (rapid ? 1.5 : 4));
  }

  const humidity = current.humidity ?? 50;
  const cloud = current.cloudCover ?? 0;
  const wind = current.windKmh ?? 0;
  let swing = 0;
  if (humidity >= 60) swing += (humidity - 60) * 1.2;
  if (cloud >= 50) swing += (cloud - 50) * 0.6;
  if (wind >= 8 && wind <= 45) swing += 20;
  else if (wind > 45) swing += 10;
  swing = clamp(Math.round(swing), 0, 100);
  const swingLabel =
    swing >= 60
      ? "High humidity swing and wind drift for bowlers and kickers."
      : swing >= 30
        ? "Moderate swing and wind drift."
        : "Low swing. Drift follows the sustained wind.";

  return {
    tossDelayProbabilityPct: Math.round(toss),
    dlsOversReductionRiskPct: dls,
    outfieldRecoveryMinutes: recovery,
    drainageSystem: stadium.drainageSystem,
    drainageBaseMinutes: base,
    coveredRoof: covered,
    windDrift: {
      wind: units.speed(wind),
      directionDeg: current.windDirectionDeg,
      humiditySwingIndex: swing,
      label: swingLabel,
    },
    summary: `${stadium.name} toss-delay probability ${Math.round(toss)}%. DLS overs-reduction risk ${dls}%. Outfield recovery about ${recovery} minutes (${stadium.drainageSystem}). ${swingLabel}`,
  };
}

export function computeIntelligence(
  forecast: ForecastResponse,
  air: AirResponse | null,
  input: WeatherEngineInput,
  neighborhoodRows: ForecastResponse[] = [],
): WeatherIntelligence {
  const offset = forecast.utc_offset_seconds ?? 0;
  const currentRaw = requireCurrent(forecast);
  const hours = parseHours(forecast, offset);
  const { slots, resolution } = parseSlots(forecast, offset, hours);
  const airParsed = parseAir(air, offset);
  const observationTime = String(currentRaw.time);
  const nowMs = parseApiTime(observationTime, offset);
  const units = unitsFor(input.unitSystem);
  const hourNow = nearestAtOrBefore(hours, nowMs);
  const current: CurrentSi = {
    time: observationTime,
    timeMs: nowMs,
    temperatureC: asNumber(currentRaw.temperature_2m),
    apparentC: asNumber(currentRaw.apparent_temperature),
    humidity: asNumber(currentRaw.relative_humidity_2m),
    isDay: asNumber(currentRaw.is_day) === 1,
    precipitationMm: asNumber(currentRaw.precipitation),
    rainMm: asNumber(currentRaw.rain),
    showersMm: asNumber(currentRaw.showers),
    snowfallCm: asNumber(currentRaw.snowfall),
    weatherCode: asNumber(currentRaw.weather_code),
    cloudCover: asNumber(currentRaw.cloud_cover),
    pressureMslHpa: asNumber(currentRaw.pressure_msl),
    surfacePressureHpa: asNumber(currentRaw.surface_pressure),
    windKmh: asNumber(currentRaw.wind_speed_10m),
    windDirectionDeg: asNumber(currentRaw.wind_direction_10m),
    gustKmh: asNumber(currentRaw.wind_gusts_10m),
  };
  const status = rainStatus(current.precipitationMm ?? 0, current.snowfallCm ?? 0, current.weatherCode ?? 0, "hour");
  const timer = buildMinuteTimer(status, slots, nowMs, resolution, hours, units);
  const airNow = airParsed.current;
  const cityTemp = current.temperatureC;
  const cityPrecip = current.precipitationMm;

  const cells = (input.neighborhoods ?? []).slice(0, 6).flatMap((neighborhood, index) => {
    const raw = neighborhoodRows[index]?.current;
    if (!raw) return [];
    const precip = asNumber(raw.precipitation) ?? 0;
    const snow = asNumber(raw.snowfall) ?? 0;
    const code = asNumber(raw.weather_code) ?? 0;
    const temp = asNumber(raw.temperature_2m);
    return [{
      name: neighborhood.name,
      landmark: neighborhood.landmark ?? null,
      latitude: neighborhood.lat,
      longitude: neighborhood.lng,
      temperature: units.temp(temp),
      precipitation: units.rain(asNumber(raw.precipitation)),
      snowfall: units.snow(snow),
      weatherCode: asNumber(raw.weather_code),
      status: rainStatus(precip, snow, code, "hour"),
      temperatureDeltaFromCity: units.deltaTemp(temp != null && cityTemp != null ? temp - cityTemp : null),
      precipitationDeltaFromCity: units.deltaRain(cityPrecip != null ? precip - cityPrecip : null),
    }];
  });

  const spread =
    cells.length > 0
      ? cells
          .filter((cell) => cell.temperature.value != null)
          .map((cell) => `${cell.name} ${cell.temperature.value}${cell.temperature.unit}`)
          .join(", ")
      : "";

  return {
    observationTime,
    timezone: forecast.timezone || input.timezone,
    unitSystem: input.unitSystem,
    cacheRevalidateSeconds: 900,
    hourlyWindow: hours
      .filter((hour) => hour.timeMs > nowMs)
      .slice(0, 12)
      .map((hour) => ({
        label: localLabel(hour.iso),
        precipitation: units.rain(hour.precipitationMm),
        probabilityPct: hour.precipProbability,
        temperature: units.temp(hour.temperatureC),
        gust: units.speed(hour.gustKmh),
      })),
    current: {
      temperature: units.temp(current.temperatureC),
      apparentTemperature: units.temp(current.apparentC),
      relativeHumidityPct: current.humidity,
      isDay: current.isDay,
      precipitation: units.rain(current.precipitationMm),
      rain: units.rain(current.rainMm),
      showers: units.rain(current.showersMm),
      snowfall: units.snow(current.snowfallCm),
      weatherCode: current.weatherCode,
      cloudCoverPct: current.cloudCover,
      pressureMsl: units.pressure(current.pressureMslHpa),
      surfacePressure: units.pressure(current.surfacePressureHpa),
      windSpeed: units.speed(current.windKmh),
      windDirectionDeg: current.windDirectionDeg,
      windGust: units.speed(current.gustKmh),
      uvIndex: hourNow?.uvIndex ?? null,
      visibility: units.visibility(hourNow?.visibilityM ?? null),
      soilTemperature: units.temp(hourNow?.soilTempC ?? null),
      soilMoistureM3: hourNow?.soilMoisture ?? null,
      freezingLevel: units.height(hourNow?.freezingLevelM ?? null),
      capeJkg: hourNow?.cape ?? null,
      snowDepth: units.depthFromMeters(hourNow?.snowDepthM ?? null),
      usAqi: asNumber(airNow?.us_aqi),
      pm2_5: { value: asNumber(airNow?.pm2_5), unit: "µg/m³" },
      pm10: { value: asNumber(airNow?.pm10), unit: "µg/m³" },
      pollenGrainsM3: {
        alder: asNumber(airNow?.alder_pollen),
        birch: asNumber(airNow?.birch_pollen),
        grass: asNumber(airNow?.grass_pollen),
        ragweed: asNumber(airNow?.ragweed_pollen),
      },
    },
    modules: {
      minuteTimer: timer,
      neighborhoodGrid: {
        cells,
        summary: cells.length
          ? `Live suburb grid: ${spread}.`
          : "No neighborhood coordinates are stored for this city yet.",
      },
      winter: buildWinter(current, hours, nowMs, timer, units),
      summer: buildSummer(current, hours, nowMs, units),
      pipeAndFlood: buildPipe(current, hours, nowMs, units),
      roofAndGutter: buildRoof(current, hours, nowMs, units),
      pressureHealth: buildPressure(current, hours, airParsed.hours, nowMs, units),
      commuteAndEv: buildCommute(current, hours, nowMs, units),
      stadium: input.stadium ? buildStadium(input.stadium, current, hours, nowMs, timer, units) : null,
    },
  };
}

export async function getWeatherIntelligence(input: WeatherEngineInput): Promise<WeatherIntelligence> {
  assertCoords(input.latitude, input.longitude);
  const neighborhoods = (input.neighborhoods ?? []).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)).slice(0, 6);
  const [forecast, air, neighborhoodPayload] = await Promise.all([
    fetchJson<ForecastResponse>(buildForecastUrl(input.latitude, input.longitude, input.timezone)),
    fetchJson<AirResponse>(buildAirUrl(input.latitude, input.longitude, input.timezone)).catch(async () => {
      const fallback = new URLSearchParams({
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        current: "us_aqi,pm2_5,pm10",
        hourly: "us_aqi,pm2_5,pm10",
        past_days: "1",
        forecast_days: "3",
        timezone: input.timezone || "auto",
      });
      try {
        return await fetchJson<AirResponse>(`https://air-quality-api.open-meteo.com/v1/air-quality?${fallback.toString()}`);
      } catch {
        return null;
      }
    }),
    neighborhoods.length
      ? fetchJson<ForecastResponse | ForecastResponse[]>(buildNeighborhoodUrl(neighborhoods, input.timezone))
      : Promise.resolve([] as ForecastResponse[]),
  ]);
  const neighborhoodRows = Array.isArray(neighborhoodPayload) ? neighborhoodPayload : neighborhoods.length ? [neighborhoodPayload] : [];
  return computeIntelligence(forecast, air, { ...input, neighborhoods }, neighborhoodRows);
}

export interface GeoHit {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
}

async function readResults(url: string): Promise<GeoHit[]> {
  const init: RequestInit = process.env.NEXT_RUNTIME
    ? ({ next: { revalidate: 86_400 } } as RequestInit)
    : {};
  const response = await fetch(url, init);
  if (!response.ok) return [];
  const payload = (await response.json()) as { results?: GeoHit[] };
  return payload.results ?? [];
}

export async function forwardGeocode(name: string): Promise<GeoHit | null> {
  const params = new URLSearchParams({ name, count: "5", language: "en", format: "json" });
  const results = await readResults(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  return results[0] ?? null;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoHit | null> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    language: "en",
    format: "json",
  });
  const results = await readResults(`https://geocoding-api.open-meteo.com/v1/reverse?${params.toString()}`);
  return results[0] ?? null;
}

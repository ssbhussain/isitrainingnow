import "server-only";

import { cache } from "react";
import { after } from "next/server";
import { getOrProvisionCity } from "@/lib/city-provisioner";
import { getWeatherIntelligence, type WeatherIntelligence } from "@/lib/weather-engine";
import type { IirnCity } from "@/lib/city-provisioner";
import { syncCityTicker } from "@/lib/ticker";

export interface CityReport {
  city: IirnCity;
  weather: WeatherIntelligence;
}

export const loadCityReport = cache(async (slug: string): Promise<CityReport> => {
  const city = await getOrProvisionCity(slug);
  const weather = await getWeatherIntelligence({
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
    unitSystem: city.unit_system,
    neighborhoods: city.neighborhoods ?? [],
  });
  after(() => syncCityTicker(city.id, city.unit_system, weather));
  return { city, weather };
});

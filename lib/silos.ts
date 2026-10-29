import type { IirnCity } from "@/lib/city-provisioner";

export type SiloId =
  | "rain"
  | "snow"
  | "heat"
  | "cold"
  | "storm"
  | "freeze-pipe-risk"
  | "hail-roof-report"
  | "migraine-pressure"
  | "ev-range-road-ice";

export interface Silo {
  id: SiloId;
  label: string;
  title: (city: string) => string;
  description: (city: IirnCity) => string;
}

export const CITY_SILOS: Silo[] = [
  {
    id: "rain",
    label: "Live Rain",
    title: (city) => `Is It Raining Right Now in ${city}? Live Minute Timer & Suburb Radar`,
    description: (city) => `Minute-by-minute rain timer, dry window, and suburb radar for ${city.name}, ${city.country}.`,
  },
  {
    id: "snow",
    label: "Snow & Ice",
    title: (city) => `Is It Snowing Right Now in ${city}? Live Accumulation, Black Ice & Snow-Day Index`,
    description: (city) => `Live snowfall, black-ice score, and snow-day delay probability for ${city.name}.`,
  },
  {
    id: "heat",
    label: "Heat & UV",
    title: (city) => `${city} Heatwave, UV Burn Timer, Wet-Bulb & Pavement Temp Tracker`,
    description: (city) => `Wet-bulb globe temperature, sunburn timer, and pavement heat for ${city.name}.`,
  },
  {
    id: "cold",
    label: "Cold & Frost",
    title: (city) => `${city} Freeze Warning, Wind Chill RealFeel & Frostbite Risk Today`,
    description: (city) => `Wind chill, frostbite timer, and freeze risk for ${city.name}.`,
  },
  {
    id: "storm",
    label: "Storm & Wind",
    title: (city) => `${city} Severe Storm, Wind Gusts, Thunder & Power Outage Tracker`,
    description: (city) => `Wind gusts, hail probability, and storm timing for ${city.name}.`,
  },
  {
    id: "freeze-pipe-risk",
    label: "Pipe & Home Risk",
    title: (city) => `Will Pipes Freeze Tonight in ${city}? Live Pipe Burst, Soil Temp & Sump Pump Alert`,
    description: (city) => `Pipe-burst score, soil temperature, and sump-pump waterlogging for ${city.name}.`,
  },
  {
    id: "hail-roof-report",
    label: "Roof & Hail",
    title: (city) => `${city} Hail Size, Roof Shingle Wind Risk & Gutter Overflow Calculator`,
    description: (city) => `Hail probability, shingle uplift, and gutter flow on a 1,500 sq ft roof in ${city.name}.`,
  },
  {
    id: "migraine-pressure",
    label: "Migraine Barometer",
    title: (city) => `${city} Barometric Pressure Migraine, Sinus & Arthritis Forecast Today`,
    description: (city) => `Six-hour and 24-hour pressure change, migraine trigger, and arthritis index for ${city.name}.`,
  },
  {
    id: "ev-range-road-ice",
    label: "EV & Road Ice",
    title: (city) => `${city} EV Cold Battery Range Loss, Tire PSI Drop & Black Ice Road Check`,
    description: (city) => `EV range loss, tire pressure drop, and road-ice check for ${city.name}.`,
  },
];

export const NAV_ITEMS = [
  ...CITY_SILOS.filter((silo) => silo.id !== "ev-range-road-ice").map((silo) => ({
    id: silo.id,
    label: silo.label,
  })),
  { id: "stadium", label: "Stadium Radar" },
];

export function siloById(id: SiloId): Silo {
  const silo = CITY_SILOS.find((item) => item.id === id);
  if (!silo) throw new Error(`Unknown silo ${id}`);
  return silo;
}

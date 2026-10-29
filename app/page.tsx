import type { Metadata } from "next";
import { GeoDetect } from "@/components/GeoDetect";
import { HubGrid } from "@/components/HubGrid";
import { LiveTicker } from "@/components/LiveTicker";
import { ProseArticle } from "@/components/ProseArticle";
import { readTicker } from "@/lib/ticker";

export const metadata: Metadata = {
  title: {
    absolute: 'Is It Raining Right Now? | Live "Is It Raining Outside" Radar, Snow, Heat & Minute Timer',
  },
  description: "Live is-it-raining-outside radar, snow, heat, and a minute timer, plus the world board of cities raining, snowing, or in a heatwave right now.",
};

export const revalidate = 900;

export default async function HomePage() {
  const ticker = await readTicker();
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">IsItRainingNow · IIRN</p>
        <div className="mt-4 grid gap-3 md:grid-cols-12">
          <article className="glass p-6 md:col-span-7 md:p-8">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Is It Raining Right Now?</h1>
            <p className="mt-4 max-w-xl text-lg text-slate-200">Live &quot;is it raining outside&quot; radar, snow, heat, and a minute timer. Search a city, a US zip, a UK postcode, or a stadium.</p>
            <form action="/search" role="search" className="mt-6 flex gap-2">
              <label htmlFor="home-search" className="sr-only">Search the world</label>
              <input id="home-search" name="q" required placeholder="City, zip, postcode, or stadium" className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400" />
              <button className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950" type="submit">Search</button>
            </form>
          </article>
          <article className="glass p-6 md:col-span-5">
            <h2 className="text-sm uppercase tracking-[0.16em] text-sky-100">This browser</h2>
            <p className="mt-3 text-slate-200">Drop a pin from this device and open the rain desk for the nearest named place.</p>
            <div className="mt-5"><GeoDetect /></div>
          </article>
          <a className="glass p-5 md:col-span-3" href="/rain/london"><h2 className="text-lg font-semibold">Live rain</h2><p className="mt-2 text-sm text-slate-300">Minute timer and suburb radar.</p></a>
          <a className="glass p-5 md:col-span-3" href="/snow/chicago"><h2 className="text-lg font-semibold">Snow and ice</h2><p className="mt-2 text-sm text-slate-300">Accumulation, black ice, snow-day index.</p></a>
          <a className="glass p-5 md:col-span-3" href="/heat/delhi"><h2 className="text-lg font-semibold">Heat and UV</h2><p className="mt-2 text-sm text-slate-300">Wet-bulb, burn timer, pavement.</p></a>
          <a className="glass p-5 md:col-span-3" href="/cold/toronto"><h2 className="text-lg font-semibold">Cold and frost</h2><p className="mt-2 text-sm text-slate-300">Wind chill and frostbite timer.</p></a>
        </div>
      </section>
      <LiveTicker {...ticker} />
      <HubGrid />
      <ProseArticle kicker="How to read the boards" heading="A world rain desk, not a single city guess">
        <p>IsItRainingNow answers the search that starts with a window: is it raining outside, right now, in a named place. The homepage does not invent a global average. It ranks cities that have already been opened on this site, using the last synced precipitation, snowfall flag, heat flag, and surface pressure stored on each city.</p>
        <p>Heavy rain right now sorts cities with the raining flag by current precipitation. Active snowfall uses the snowing flag. Extreme heat uses the heatwave flag, set when the wet-bulb risk is high or the air temperature is at least 35°C. Deepest lows sorts the lowest stored surface pressure. That last board is a deep-low ranking, not a measured six-hour drop. The six-hour and twenty-four-hour pressure change lives on each city migraine desk, where the hourly series is in hand.</p>
        <p>A city desk opens from search, from a hub link, or from a stadium host city. The first visit resolves the place, stores six real districts, the transit system, airports, and flood corridors, then renders the live Open-Meteo hour. Later visits read that record and refresh the weather. The world boards fill as those visits happen. An empty board means no city with that flag has been synced yet, not that the planet is dry.</p>
        <p>Search accepts a city name, a five-digit US zip, a UK postcode, or a stadium name. Zips and postcodes are geocoded to a place, then sent to the rain desk. Names that include stadium, ground, arena, or Lord&apos;s open the washout desk instead, with toss-delay probability, DLS risk, and an outfield countdown based on the venue drainage note.</p>
        <p>The nine navigation pills keep the city you are already reading and switch the desk: live rain, snow and ice, heat and UV, cold and frost, storm and wind, pipe and home risk, roof and hail, migraine barometer, and stadium radar. From the homepage, those pills start at New York City, London, or Lord&apos;s so there is always a concrete destination.</p>
        <p>Use the hub grid when you already know the city. United States, United Kingdom, Canada, Australia, and India each list flagship cities with direct links into rain, snow, heat, pipes, hail, and pressure. Those are the seasonal and high-intent paths. Stadium washout links sit under the grid for Lord&apos;s, Yankee Stadium, and M. Chinnaswamy Stadium.</p>
        <p>Numbers on a city page are computed on the server from the forecast and air-quality feeds and cached for fifteen minutes. The page you receive already contains the temperature, the rain total, and the hazard scores. There is no second step that swaps in a placeholder after the HTML arrives.</p>
        <p>The long briefing under each dashboard is there to be read. It repeats the live telemetry in sentences, compares the stored neighborhoods, and names the transit system, airports, and flood corridors for that city. Advertisements, when the publisher and Grow identifiers are configured, are allowed to sit in the space between those paragraphs. The briefing itself stays in ordinary paragraphs, not inside a scrolling box.</p>
      </ProseArticle>
    </main>
  );
}

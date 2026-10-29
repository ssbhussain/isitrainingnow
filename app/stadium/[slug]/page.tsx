import type { Metadata } from "next";
import { ProseArticle } from "@/components/ProseArticle";
import { fmt, num } from "@/lib/format";
import { FEATURED_STADIUMS } from "@/lib/hubs";
import { getOrProvisionStadium, slugify } from "@/lib/city-provisioner";
import { SITE_URL } from "@/lib/site";
import { getWeatherIntelligence } from "@/lib/weather-engine";

type RouteProps = { params: Promise<{ slug: string }> };

export const revalidate = 900;

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const known = FEATURED_STADIUMS.find((item) => item.slug === slug);
  const stadium = await getOrProvisionStadium(slug, known?.query);
  const title = `${stadium.name} Weather Today | Toss Delay, DLS & Outfield Drainage`;
  return {
    title: { absolute: title },
    description: `Live rain delay, DLS risk, and outfield recovery for ${stadium.name} in ${stadium.city_name}.`,
    alternates: { canonical: `${SITE_URL}/stadium/${stadium.slug}` },
  };
}

export default async function StadiumPage({ params }: RouteProps) {
  const { slug } = await params;
  const known = FEATURED_STADIUMS.find((item) => item.slug === slug);
  const stadium = await getOrProvisionStadium(slug, known?.query);
  const weather = await getWeatherIntelligence({
    latitude: stadium.latitude,
    longitude: stadium.longitude,
    timezone: stadium.timezone,
    unitSystem: stadium.country_code === "US" ? "imperial" : stadium.country_code === "GB" ? "uk_hybrid" : "metric",
    stadium: {
      name: stadium.name,
      sport: stadium.sport,
      drainageSystem: stadium.drainage_system || "Standard Grass Outfield (75 min recovery)",
      roofType: stadium.roof_type,
    },
  });
  const washout = weather.modules.stadium;
  const hours = weather.hourlyWindow;
  const peak = Math.max(...hours.map((hour) => hour.precipitation.value ?? 0), 0.01);
  const citySlug = slugify(stadium.city_name);
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is there a rain delay at ${stadium.name}?`,
        acceptedAnswer: { "@type": "Answer", text: washout?.summary ?? weather.modules.minuteTimer.summary },
      },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-200">{stadium.sport} · {stadium.city_name}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-12">
          <article className="glass p-6 md:col-span-7 md:p-8">
            <h1 className="text-4xl font-semibold tracking-tight">{stadium.name} weather today</h1>
            <p className="mt-6 text-5xl font-semibold tabular-nums">{washout ? `${washout.tossDelayProbabilityPct}%` : weather.modules.minuteTimer.status}</p>
            <p className="mt-3 text-slate-200">Toss delay probability. DLS overs-reduction risk {washout?.dlsOversReductionRiskPct ?? 0}%. Outfield recovery {washout?.outfieldRecoveryMinutes ?? 0} minutes.</p>
          </article>
          <article className="glass p-6 md:col-span-5">
            <h2 className="text-sm uppercase tracking-[0.16em] text-sky-100">Drainage</h2>
            <p className="mt-3">{stadium.drainage_system}</p>
            <p className="mt-2 text-sm text-slate-300">Roof: {stadium.roof_type}. Capacity {stadium.capacity?.toLocaleString() ?? "not listed"}. Base recovery {washout?.drainageBaseMinutes ?? 75} minutes.</p>
            <a className="mt-5 inline-flex text-sm font-semibold text-sky-200" href={`/rain/${citySlug}`}>Open {stadium.city_name} rain desk</a>
          </article>
          <article className="glass p-5 md:col-span-12">
            <h2 className="text-sm uppercase tracking-[0.16em] text-sky-100">Match-window rain</h2>
            <ol className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12">
              {hours.map((hour) => (
                <li key={hour.label} className="text-center text-xs text-slate-300">
                  <div className="flex h-24 items-end">
                    <div className="w-full rounded-t bg-sky-300/80" style={{ height: `${Math.max(6, ((hour.precipitation.value ?? 0) / peak) * 100)}%` }} />
                  </div>
                  <p className="mt-1">{hour.label.slice(11)}</p>
                  <p className="tabular-nums">{fmt(hour.precipitation)}</p>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>
      <ProseArticle kicker={`${stadium.name} briefing`} heading={`Washout desk for ${stadium.name}`}>
        <p>{stadium.name} in {stadium.city_name}, {stadium.country}, is a {stadium.sport} venue with capacity {stadium.capacity?.toLocaleString() ?? "unlisted"}. The observation is {weather.observationTime} in {weather.timezone}. Live status at the ground is {weather.modules.minuteTimer.status}. Temperature {fmt(weather.current.temperature)}, rain {fmt(weather.current.precipitation)}, wind {fmt(weather.current.windSpeed)}, gust {fmt(weather.current.windGust)}, pressure {fmt(weather.current.surfacePressure, 2)}.</p>
        <p>{washout?.summary} Covered-roof flag is {washout?.coveredRoof ? "on, so outdoor rain is not treated as a stoppage" : "off, so the ground is treated as open to the weather"}. Drainage text on file: {stadium.drainage_system}. The countdown adds the minutes until rain stops, the base recovery parsed from that text, and extra minutes for rain already fallen in six hours.</p>
        <p>{weather.modules.minuteTimer.summary} Past six-hour rain {fmt(weather.modules.minuteTimer.past6hRain)}. Past twenty-four-hour rain {fmt(weather.modules.minuteTimer.past24hRain)}. Those totals are what lengthen the outfield clock after the shower ends.</p>
        <p>Toss delay is {washout?.tossDelayProbabilityPct ?? 0} percent. It rises when rain is already falling and otherwise follows the precipitation probability in the next few hours. DLS overs-reduction risk is {washout?.dlsOversReductionRiskPct ?? 0} percent, from the share of the next eight hours that are wet or carry at least a 60 percent chance. For a non-cricket sport, read that figure as interruption risk rather than as lost overs.</p>
        <p>Wind is {fmt(washout?.windDrift.wind)} from {num(washout?.windDrift.directionDeg, 0)} degrees. Humidity swing index is {washout?.windDrift.humiditySwingIndex ?? 0} out of 100. {washout?.windDrift.label} Pitch note: {stadium.pitch_and_wind_notes || "No venue note is stored yet."}</p>
        <p>Hourly window: {hours.map((hour) => `${hour.label} ${fmt(hour.precipitation)} (${num(hour.probabilityPct, 0)} percent), ${fmt(hour.temperature)}`).join("; ") || "no hourly steps returned"}.</p>
        <p>Roof hail context at the same coordinates: probability {weather.modules.roofAndGutter.hailProbabilityPct} percent, uplift {weather.modules.roofAndGutter.shingleUplift.level}. A ground that also hosts concerts or has a canopy should still treat gusts as a loose-fixture problem even when the playing surface drains quickly.</p>
        <p>The host city desk is separate. <a href={`/rain/${citySlug}`}>{stadium.city_name} rain</a>, <a href={`/storm/${citySlug}`}>storm</a>, and <a href={`/migraine-pressure/${citySlug}`}>pressure</a> use the city record, including neighborhoods and commute corridors, once that city has been opened.</p>
      </ProseArticle>
    </main>
  );
}

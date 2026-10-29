import { ProseArticle } from "@/components/ProseArticle";
import { fmt } from "@/lib/format";
import { reverseGeocode, forwardGeocode } from "@/lib/geocode";
import { slugify } from "@/lib/city-provisioner";
import { getWeatherIntelligence } from "@/lib/weather-engine";

export default async function NearPage({ searchParams }: { searchParams: Promise<{ lat?: string; lng?: string }> }) {
  const { lat, lng } = await searchParams;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl font-semibold">Location</h1>
        <p className="mt-3 text-slate-300">This page needs a latitude and longitude from the browser button.</p>
      </main>
    );
  }

  const place = await reverseGeocode(latitude, longitude);
  const named = place?.name ? await forwardGeocode(place.name) : null;
  const timezone = named?.timezone || place?.timezone || "auto";
  const weather = await getWeatherIntelligence({
    latitude,
    longitude,
    timezone,
    unitSystem: place?.country_code === "US" ? "imperial" : place?.country_code === "GB" ? "uk_hybrid" : "metric",
  });
  const cityHref = place?.name ? `/rain/${slugify(place.name)}` : null;

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-200">Browser position</p>
        <div className="mt-4 grid gap-3 md:grid-cols-12">
          <article className="glass p-6 md:col-span-7">
            <h1 className="text-4xl font-semibold tracking-tight">{place?.name ? `Near ${place.name}` : "Your position"}</h1>
            <p className="mt-4 text-5xl font-semibold tabular-nums">{weather.modules.minuteTimer.status}</p>
            <p className="mt-3 text-slate-200">{fmt(weather.current.temperature)} · {fmt(weather.current.precipitation)} · {fmt(weather.current.windSpeed)}</p>
            {cityHref ? <a className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950" href={cityHref}>Open the {place?.name} rain desk</a> : null}
          </article>
          <article className="glass p-6 md:col-span-5">
            <p className="text-sm text-slate-300">{latitude.toFixed(3)}, {longitude.toFixed(3)}</p>
            <p className="mt-4 text-slate-200">{weather.modules.minuteTimer.summary}</p>
          </article>
        </div>
      </section>
      <ProseArticle kicker="This position" heading="What the pin is showing">
        <p>The status above is the Open-Meteo hour for the coordinates this browser sent. It is not saved as a user profile. Opening the named city desk is a separate step, and that is what adds the city to the world boards.</p>
        <p>{weather.modules.minuteTimer.summary} Temperature {fmt(weather.current.temperature)}. Wind {fmt(weather.current.windSpeed)}. Pressure {fmt(weather.current.surfacePressure, 2)}.</p>
        <p>{weather.modules.pipeAndFlood.summary}</p>
        <p>{weather.modules.summer.summary}</p>
      </ProseArticle>
    </main>
  );
}

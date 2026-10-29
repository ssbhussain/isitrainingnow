import type { CityReport } from "@/lib/city-report";
import { fmt, num } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { siloById, type SiloId } from "@/lib/silos";
import { CityBriefing } from "@/components/CityBriefing";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

export function CityExperience({ siloId, report }: { siloId: SiloId; report: CityReport }) {
  const silo = siloById(siloId);
  const { city, weather } = report;
  const title = silo.title(city.name);
  const timer = weather.modules.minuteTimer;
  const hero = heroValue(siloId, weather);
  const place = `${city.name}, ${city.country}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WeatherForecast",
        name: title,
        url: `${SITE_URL}/${silo.id}/${city.slug}`,
        dateIssued: weather.observationTime,
        about: {
          "@type": "Place",
          name: place,
          address: { "@type": "PostalAddress", addressCountry: city.country_code },
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Is it raining right now in ${city.name}?`,
            acceptedAnswer: { "@type": "Answer", text: timer.summary },
          },
          {
            "@type": "Question",
            name: `Will pipes freeze tonight in ${city.name}?`,
            acceptedAnswer: { "@type": "Answer", text: weather.modules.pipeAndFlood.summary },
          },
          {
            "@type": "Question",
            name: `What is the barometric pressure change in ${city.name}?`,
            acceptedAnswer: { "@type": "Answer", text: weather.modules.pressureHealth.summary },
          },
          {
            "@type": "Question",
            name: `How hot is the pavement in ${city.name}?`,
            acceptedAnswer: { "@type": "Answer", text: weather.modules.summer.summary },
          },
        ],
      },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">{silo.label} · {city.weather_agency}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-12">
          <article className="glass p-6 md:col-span-7 md:p-8">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
            <p className="mt-6 text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">{hero.primary}</p>
            <p className="mt-3 max-w-xl text-slate-200">{hero.secondary}</p>
          </article>
          <article className="glass flex flex-col justify-between p-6 md:col-span-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Observation</p>
            <p className="mt-4 text-lg">{weather.observationTime}</p>
            <p className="text-slate-300">{weather.timezone}</p>
            <p className="mt-4 text-sm text-slate-300">{place}</p>
          </article>
          <div className="grid gap-3 sm:grid-cols-2 md:col-span-12 md:grid-cols-4">
            <Metric label="Temperature" value={fmt(weather.current.temperature)} />
            <Metric label="Wind gust" value={fmt(weather.current.windGust)} />
            <Metric label="Pressure" value={fmt(weather.current.surfacePressure, 2)} />
            <Metric label="Rain now" value={fmt(weather.current.precipitation)} />
          </div>
          <article className="glass p-5 md:col-span-6">
            <h2 className="text-sm uppercase tracking-[0.16em] text-sky-100">Minute timer</h2>
            <p className="mt-3 text-slate-100">{timer.summary}</p>
          </article>
          <article className="glass p-5 md:col-span-6">
            <h2 className="text-sm uppercase tracking-[0.16em] text-sky-100">Suburb radar</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {weather.modules.neighborhoodGrid.cells.length === 0 ? (
                <li className="text-slate-300">Neighborhood coordinates are not stored yet.</li>
              ) : weather.modules.neighborhoodGrid.cells.map((cell) => (
                <li key={cell.name} className="flex justify-between gap-3">
                  <span>{cell.name}</span>
                  <span className="tabular-nums text-slate-300">{fmt(cell.temperature)} · {fmt(cell.precipitation)}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
      <CityBriefing city={city} weather={weather} />
    </main>
  );
}

function heroValue(siloId: SiloId, weather: CityReport["weather"]): { primary: string; secondary: string } {
  const modules = weather.modules;
  switch (siloId) {
    case "snow":
      return { primary: modules.winter.snowDayDelay.level, secondary: `${fmt(modules.winter.snowAccumulation24h)} in 24 hours. Black ice ${modules.winter.blackIce.level}.` };
    case "heat":
      return { primary: modules.summer.heatstrokeRisk, secondary: `WBGT ${fmt(modules.summer.wbgt)}. Pavement ${fmt(modules.summer.pavementTemperature)}.` };
    case "cold":
      return { primary: fmt(modules.winter.frostbite.windChill), secondary: modules.winter.frostbite.label };
    case "storm":
      return { primary: fmt(weather.current.windGust), secondary: `Hail probability ${modules.roofAndGutter.hailProbabilityPct} percent. Weather code ${num(weather.current.weatherCode, 0)}.` };
    case "freeze-pipe-risk":
      return { primary: modules.pipeAndFlood.pipeBurst.level, secondary: modules.pipeAndFlood.summary };
    case "hail-roof-report":
      return { primary: `${modules.roofAndGutter.hailProbabilityPct}% hail probability`, secondary: `Shingle uplift ${modules.roofAndGutter.shingleUplift.level}. Gutter flow ${fmt(modules.roofAndGutter.gutter.flow, 0)}.` };
    case "migraine-pressure":
      return { primary: modules.pressureHealth.migraineRisk, secondary: modules.pressureHealth.summary };
    case "ev-range-road-ice":
      return { primary: `${modules.commuteAndEv.evRangeLossPct}% range loss`, secondary: `Tire drop ${modules.commuteAndEv.tirePressurePsiDrop} PSI. Black ice ${modules.winter.blackIce.level}.` };
    default:
      return { primary: modules.minuteTimer.status, secondary: modules.minuteTimer.summary };
  }
}

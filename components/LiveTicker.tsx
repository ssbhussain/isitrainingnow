import type { TickerCity } from "@/lib/ticker";

function Board({ title, rows, detail }: { title: string; rows: TickerCity[]; detail: (row: TickerCity) => string }) {
  return (
    <article className="glass p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-100">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-300">No city on the board yet. Open a city desk and the next ranking includes it.</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {rows.map((row) => (
            <li key={row.slug} className="flex items-baseline justify-between gap-3 text-sm">
              <a href={`/rain/${row.slug}`} className="font-medium text-white">{row.name}</a>
              <span className="text-slate-300">{detail(row)}</span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

export function LiveTicker({
  rain,
  snow,
  heat,
  pressure,
}: {
  rain: TickerCity[];
  snow: TickerCity[];
  heat: TickerCity[];
  pressure: TickerCity[];
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="world-ticker">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Which city is raining now in the world</p>
      <h2 id="world-ticker" className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight">Live rain, snow, heat, and deep-low pressure boards</h2>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Board title="Heavy rain right now" rows={rain} detail={(row) => `${row.current_precip_mm?.toFixed(1) ?? "0.0"} mm`} />
        <Board title="Active snowfall right now" rows={snow} detail={(row) => `${row.current_temp_c?.toFixed(1) ?? "—"} °C`} />
        <Board title="Extreme heat right now" rows={heat} detail={(row) => `${row.current_temp_c?.toFixed(1) ?? "—"} °C`} />
        <Board title="Deepest lows right now" rows={pressure} detail={(row) => `${row.current_pressure_hpa?.toFixed(0) ?? "—"} hPa`} />
      </div>
    </section>
  );
}

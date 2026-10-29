import { FEATURED_STADIUMS, HUB_GROUPS, HUBS } from "@/lib/hubs";

const LINKS = [
  ["rain", "Rain"],
  ["snow", "Snow"],
  ["heat", "Heat"],
  ["freeze-pipe-risk", "Pipes"],
  ["hail-roof-report", "Hail"],
  ["migraine-pressure", "Pressure"],
] as const;

export function HubGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="hubs">
      <h2 id="hubs" className="text-3xl font-semibold tracking-tight">Featured Western and global hubs</h2>
      <p className="mt-2 max-w-3xl text-slate-300">Seasonal desks and high-intent hazard desks for the United States, United Kingdom, Canada, Australia, and India.</p>
      <div className="mt-8 space-y-8">
        {HUB_GROUPS.map((group) => (
          <div key={group}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">{group}</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {HUBS.filter((hub) => hub.group === group).map((hub) => (
                <li key={hub.slug} className="glass p-4">
                  <p className="font-semibold">{hub.name}</p>
                  <p className="text-sm text-slate-300">{hub.country}</p>
                  <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                    {LINKS.map(([path, label]) => (
                      <li key={path}>
                        <a className="rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15" href={`/${path}/${hub.slug}`}>{label}</a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <h3 className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">Live stadium washout trackers</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {FEATURED_STADIUMS.map((stadium) => (
          <li key={stadium.slug}>
            <a className="glass inline-flex px-4 py-2 text-sm" href={`/stadium/${stadium.slug}`}>{stadium.name}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

import { redirect } from "next/navigation";
import { ProseArticle } from "@/components/ProseArticle";
import { resolveSearch } from "@/lib/search";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  if (query.length >= 2) {
    const destination = await resolveSearch(query);
    if (destination) redirect(destination);
  }

  return (
    <main>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">Search</h1>
        <p className="mt-3 text-slate-300">{query ? `No place match for “${query}”.` : "Enter a city, US zip, UK postcode, or stadium."}</p>
        <form action="/search" className="mt-6 flex gap-2">
          <label htmlFor="retry-search" className="sr-only">Search again</label>
          <input id="retry-search" name="q" defaultValue={query} required className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-3" />
          <button className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950" type="submit">Search</button>
        </form>
      </section>
      <ProseArticle kicker="Search help" heading="What the box accepts">
        <p>A city name such as Aligarh, Hyderabad, or Seattle is geocoded and opened on the live rain desk. The stored slug follows the place name returned by the geocoder.</p>
        <p>A US zip such as 10001 and a UK postcode such as SW1A 1AA are sent through the same geocoder. If a place comes back, you land on that city’s rain page rather than on a zip-shaped URL.</p>
        <p>A query that includes stadium, ground, arena, ballpark, oval, or Lord&apos;s opens the washout desk. Lord&apos;s, Yankee Stadium, and M. Chinnaswamy Stadium are the featured venues on the homepage.</p>
        <p>If nothing geocodes, you stay on this page. Try the city name without a neighborhood, or open a featured hub from the homepage.</p>
      </ProseArticle>
    </main>
  );
}

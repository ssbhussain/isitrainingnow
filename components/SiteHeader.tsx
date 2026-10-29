import { Search } from "lucide-react";
import { NavPills } from "@/components/NavPills";
import { SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href="/" className="shrink-0">
            <span className="block text-sm font-semibold tracking-tight">{SITE_NAME}</span>
            <span className="block text-xs text-slate-300">Global live weather, snow, heat, and hazard intelligence</span>
          </a>
          <form action="/search" role="search" className="flex min-w-0 flex-1 gap-2">
            <label htmlFor="site-search" className="sr-only">
              Search any city, US zip code, UK postcode, or stadium
            </label>
            <input
              id="site-search"
              name="q"
              required
              placeholder="City, US zip, UK postcode, or stadium"
              className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-400"
            />
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">
              <Search className="size-4" aria-hidden="true" />
              Search
            </button>
          </form>
        </div>
        <NavPills />
      </div>
    </header>
  );
}

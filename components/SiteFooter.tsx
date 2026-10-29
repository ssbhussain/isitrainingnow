import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <p>{SITE_NAME} publishes deterministic weather intelligence. It is not an emergency warning service.</p>
        <nav aria-label="Site">
          <ul className="flex flex-wrap gap-4">
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/privacy-policy">Privacy</a></li>
            <li><a href="/terms">Terms</a></li>
            <li><a href="/sitemap.xml">Sitemap</a></li>
          </ul>
        </nav>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </div>
    </footer>
  );
}

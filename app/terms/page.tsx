import type { Metadata } from "next";
import { ProseArticle } from "@/components/ProseArticle";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Terms of Use | ${SITE_NAME}` },
  description: "Terms for using IsItRainingNow weather, hazard, and stadium pages.",
};

export default function TermsPage() {
  return (
    <main>
      <ProseArticle kicker="Legal" heading="Terms of use">
        <p>These terms cover your use of {SITE_NAME} at {SITE_URL}. By opening a page you agree to them. If you do not agree, do not use the site. Contact {CONTACT_EMAIL} with questions.</p>
        <p>The pages are a decision aid built from public weather feeds, published formulas, and stored place context. They are not a warning from a national meteorological service, not an insurance inspection, and not medical advice. A pipe-freeze score, a hail probability, a migraine classification, or a stadium delay percentage does not replace an official warning, a roofer, a physician, or the venue’s own announcement.</p>
        <p>Forecasts change. A page may be cached for about fifteen minutes. Numbers can be missing when the upstream feed omits a field, and a missing field is shown as no reading rather than filled with a guess. Hail pages report probability, not a measured stone diameter. Storm pages report gusts and convective potential, not a utility outage map.</p>
        <p>You may link to public pages and quote short excerpts with attribution. You may not copy the site into another product, scrape it in a way that degrades service, or present the scores as your own certified measurement. Automated access that ignores ordinary rate limits can be blocked.</p>
        <p>Search is provided as is. A zip code, postcode, city name, or stadium name is resolved to the best public geocode we can obtain. If that match is the wrong place, use a more specific name. We do not promise that every neighborhood label is the official administrative district.</p>
        <p>Advertising from Google AdSense and, when configured, Grow by Mediavine may appear between paragraphs. Those partners have their own terms. We do not control the creative that an ad network chooses to show.</p>
        <p>The site is provided without warranty of any kind, including fitness for a particular trip, match, or property decision. To the extent the law allows, we are not liable for decisions you make from a page, for upstream data outages, or for indirect or consequential loss. Nothing in these terms limits liability that cannot legally be limited.</p>
        <p>We may change the desks, the formulas, or these terms. The version on this page is the one that applies. These terms are governed by the laws of India, without prejudice to consumer protections that apply where you live and cannot be waived.</p>
      </ProseArticle>
    </main>
  );
}

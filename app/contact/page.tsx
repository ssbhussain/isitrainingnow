import type { Metadata } from "next";
import { ProseArticle } from "@/components/ProseArticle";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Contact | ${SITE_NAME}` },
  description: "Contact IsItRainingNow about a city desk, a correction, or a privacy request.",
};

export default function ContactPage() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">IsItRainingNow</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Contact</h1>
        <p className="mt-4 text-lg text-slate-200">Email {CONTACT_EMAIL}. There is no account inbox on this site.</p>
        <a className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </section>
      <ProseArticle kicker="What to send" heading="Corrections, privacy, and partnerships">
        <p>For a wrong neighborhood, airport, or stadium drainage note, include the page URL and the correction. Place context is stored the first time a city or ground is created, and a specific correction is more useful than a general complaint.</p>
        <p>Privacy requests, including GDPR access or deletion and CCPA / CPRA requests, should use the subject line that names the right. We do not keep an account, so include the page or the email context that lets us find what you mean. Advertising opt-outs for Google and Mediavine are also linked from the privacy policy.</p>
        <p>The desks are not a channel for emergency warnings. If you are in immediate danger from a storm, a flood, or a medical emergency, use local emergency services. A page on this site can be fifteen minutes behind the latest model run.</p>
        <p>Partnership and advertising notes can use the same address. The public AdSense relationship is declared at /ads.txt. Grow by Mediavine runs only after a site identifier is configured for this property.</p>
      </ProseArticle>
    </main>
  );
}

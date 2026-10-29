import type { Metadata } from "next";
import { ProseArticle } from "@/components/ProseArticle";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Privacy Policy | ${SITE_NAME}` },
  description: "How IsItRainingNow handles location, cookies, Google AdSense, and Grow by Mediavine.",
};

export default function PrivacyPage() {
  return (
    <main>
      <ProseArticle kicker="Legal" heading="Privacy policy">
        <p>{SITE_NAME} ({SITE_URL}) publishes live weather and hazard pages. This policy explains what the site collects, what advertising partners may collect, and the choices available under the GDPR and the CCPA / CPRA. Questions go to {CONTACT_EMAIL}.</p>
        <p>The site does not require an account. Search queries and the city or stadium you open are processed to render that page. A city record stores the place name, coordinates, neighborhoods, transit, airports, and flood corridors so the page can be served again. It does not store your name, email, or a profile of pages you visited.</p>
        <p>The “Use my location” control asks the browser for a one-time position only after you click it. Those coordinates are sent to this site to look up the nearest place and the current hour. They are not written into an account, and declining the prompt leaves the rest of the site usable. You can also type a city, a US zip code, or a UK postcode instead.</p>
        <p>Server logs may include IP address, user agent, and the URL requested. Those logs are used to keep the site available and to diagnose failed weather requests. They are not sold as a marketing list.</p>
        <p>Cookies and similar storage may be set by this site and by advertising partners. A strictly necessary cookie, if present, remembers a preference such as a consent choice. Advertising cookies are used to measure views, limit how often an ad is shown, and, where the law allows, to show ads that relate to sites you have visited.</p>
        <p>Google AdSense may serve ads on these pages. Google and its partners use cookies to serve ads based on visits to this site and other sites. You can opt out of personalized advertising at https://adssettings.google.com and read how Google uses data at https://policies.google.com/technologies/ads. The AdSense publisher identifier is loaded from this site’s configuration. The ads.txt file at /ads.txt names that publisher relationship.</p>
        <p>Grow by Mediavine, including Journey by Mediavine, may also place advertising and measurement scripts when a site identifier is configured. Mediavine uses cookies to deliver, measure, and manage ads. Their privacy choices and partner list are published at https://www.mediavine.com/privacy-policy/ and https://www.mediavine.com/gdpr/. If the Grow identifier is blank, that script is not injected.</p>
        <p>If you are in the European Economic Area or the United Kingdom, the lawful bases we rely on are legitimate interest for serving the page you requested and for essential logs, and consent where a non-essential advertising cookie requires it. You may request access, correction, deletion, or restriction, and you may object to processing based on legitimate interest. Send the request to {CONTACT_EMAIL}. You may also lodge a complaint with your supervisory authority.</p>
        <p>If you are a California resident, you may request to know the categories of personal information collected, request deletion, and opt out of the sale or sharing of personal information as those terms are defined by the CCPA / CPRA. We do not sell personal information for money. Advertising cookies can be a “share” under California law. Use the Google and Mediavine controls above, or email {CONTACT_EMAIL} with the subject “CCPA request”. We will not discriminate against you for exercising these rights.</p>
        <p>Weather values come from Open-Meteo. Place names may be sent to that geocoding service and, the first time a city is created, a short place description may be requested from an AI model so neighborhoods and airports can be stored. Do not submit health records, account passwords, or other sensitive personal data in the search box.</p>
        <p>This policy may be updated when the advertising setup or the data we store changes. The page you are reading is the current version. Continued use of the site after an update means the updated policy applies to later visits.</p>
      </ProseArticle>
    </main>
  );
}

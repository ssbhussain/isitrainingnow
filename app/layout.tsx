import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { adsenseClientId, growSiteId, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const adsense = adsenseClientId();
const growId = growSiteId();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Is It Raining Right Now? | Live "Is It Raining Outside" Radar, Snow, Heat & Minute Timer',
    template: "%s",
  },
  description: "Global live weather, snow, heat, and hazard intelligence. Minute timers, suburb radar, and high-intent home, roof, pressure, and stadium desks.",
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_NAME,
    description: "Global live weather, snow, heat, and hazard intelligence.",
  },
  other: adsense ? { "google-adsense-account": adsense } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#070b14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {growId ? (
          <script
            data-grow-initializer=""
            dangerouslySetInnerHTML={{
              __html: `!(function(){window.growMe||((window.growMe=function(e){window.growMe._.push(e);}),(window.growMe._=[]));var e=document.createElement("script");e.type="text/javascript";e.src="https://faves.grow.me/main.js";e.defer=!0;e.setAttribute("data-grow-faves-site-id","${growId}");var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t);})();`,
            }}
          />
        ) : null}
      </head>
      <body>
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-3 focus:py-2 focus:text-slate-950">
          Skip to content
        </a>
        <SiteHeader />
        <div id="content">{children}</div>
        <SiteFooter />
        {adsense ? (
          <Script
            id="adsense-script"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsense}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </body>
    </html>
  );
}

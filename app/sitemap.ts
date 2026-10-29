import type { MetadataRoute } from "next";
import { PRIORITY_1, PRIORITY_2, PRIORITY_3, STADIUMS } from "@/scripts/catalog";
import { CITY_SILOS } from "@/lib/silos";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const staticRoutes = ["", "/about", "/contact", "/privacy-policy", "/terms"].map((path) => ({
    url: `${SITE_URL}${path || "/"}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.4,
  }));
  const citySlugs = [...new Set([...PRIORITY_1, ...PRIORITY_2, ...PRIORITY_3].map((city) => city.slug))];
  const cities = citySlugs.flatMap((slug) => CITY_SILOS.map((silo) => ({
    url: `${SITE_URL}/${silo.id}/${slug}`,
    lastModified,
    changeFrequency: "hourly" as const,
    priority: 0.7,
  })));
  const stadiums = STADIUMS.map((stadium) => ({
    url: `${SITE_URL}/stadium/${stadium.slug}`,
    lastModified,
    changeFrequency: "hourly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...cities, ...stadiums];
}

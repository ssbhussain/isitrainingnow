import "server-only";

import { forwardGeocode } from "@/lib/geocode";
import { getOrProvisionCity, getOrProvisionStadium, slugify } from "@/lib/city-provisioner";

const STADIUM_QUERY = /\b(stadium|arena|ground|ballpark|coliseum|oval|lords|lord's)\b/i;

export async function resolveSearch(query: string): Promise<string | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;
  if (STADIUM_QUERY.test(trimmed)) {
    const slug = slugify(trimmed);
    await getOrProvisionStadium(slug, trimmed);
    return `/stadium/${slug}`;
  }
  const hit = await forwardGeocode(trimmed);
  if (!hit) return null;
  const slug = slugify(hit.name);
  await getOrProvisionCity(slug, hit.name);
  return `/rain/${slug}`;
}

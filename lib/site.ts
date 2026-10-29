export const SITE_NAME = "IsItRainingNow";
export const SITE_URL = "https://isitrainingnow.in";
export const CONTACT_EMAIL = "hello@isitrainingnow.in";

export function adsensePublisherId(): string {
  const raw = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID?.trim() ?? "";
  if (!raw) return "";
  return raw.startsWith("ca-") ? raw.slice(3) : raw;
}

export function adsenseClientId(): string {
  return process.env.NEXT_PUBLIC_ADSENSE_PUB_ID?.trim() ?? "";
}

export function growSiteId(): string {
  const value = process.env.NEXT_PUBLIC_GROW_SITE_ID?.trim() ?? "";
  return /^[A-Za-z0-9+/=_-]+$/.test(value) ? value : "";
}

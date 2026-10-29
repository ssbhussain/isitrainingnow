import { adsensePublisherId } from "@/lib/site";

export function GET() {
  const publisher = adsensePublisherId();
  const line = publisher
    ? `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`
    : "";
  return new Response(line, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

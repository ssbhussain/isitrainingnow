import type { Metadata } from "next";
import { CityExperience } from "@/components/CityExperience";
import { loadCityReport } from "@/lib/city-report";
import { SITE_URL } from "@/lib/site";
import { siloById, type SiloId } from "@/lib/silos";

type RouteProps = { params: Promise<{ slug: string }> };

export function createSiloPage(siloId: SiloId) {
  const silo = siloById(siloId);

  async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const { slug } = await params;
    const { city } = await loadCityReport(slug);
    const title = silo.title(city.name);
    return {
      title,
      description: silo.description(city),
      alternates: { canonical: `${SITE_URL}/${silo.id}/${city.slug}` },
      openGraph: { title, description: silo.description(city), url: `${SITE_URL}/${silo.id}/${city.slug}` },
    };
  }

  async function Page({ params }: RouteProps) {
    const { slug } = await params;
    const report = await loadCityReport(slug);
    return <CityExperience siloId={siloId} report={report} />;
  }

  return { generateMetadata, Page };
}

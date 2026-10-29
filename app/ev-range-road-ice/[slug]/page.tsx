import { createSiloPage } from "@/lib/create-silo-page";

const page = createSiloPage("ev-range-road-ice");
export const revalidate = 900;
export const generateMetadata = page.generateMetadata;
export default page.Page;

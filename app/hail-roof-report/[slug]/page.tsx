import { createSiloPage } from "@/lib/create-silo-page";

const page = createSiloPage("hail-roof-report");
export const revalidate = 900;
export const generateMetadata = page.generateMetadata;
export default page.Page;

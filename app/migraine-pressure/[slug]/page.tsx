import { createSiloPage } from "@/lib/create-silo-page";

const page = createSiloPage("migraine-pressure");
export const revalidate = 900;
export const generateMetadata = page.generateMetadata;
export default page.Page;

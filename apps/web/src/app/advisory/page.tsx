import type { Metadata } from "next";
import { DivisionPage } from "@/components/DivisionPage";
import { getDivision } from "@/lib/content";

const division = getDivision("advisory");

export const metadata: Metadata = {
  title: division.name,
  description: division.mission,
  alternates: { canonical: `/${division.slug}` },
};

export default function AdvisoryPage() {
  return <DivisionPage division={division} />;
}

import type { Metadata } from "next";
import { DivisionPage } from "@/components/DivisionPage";
import { getDivision } from "@/lib/content";

const division = getDivision("academy");

export const metadata: Metadata = {
  title: division.name,
  description: division.mission,
};

export default function AcademyPage() {
  return <DivisionPage division={division} />;
}

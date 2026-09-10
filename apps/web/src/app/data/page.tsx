import type { Metadata } from "next";
import { DivisionPage } from "@/components/DivisionPage";
import { getDivision } from "@/lib/content";

const division = getDivision("data");

export const metadata: Metadata = {
  title: division.name,
  description: division.mission,
};

export default function DataPage() {
  return <DivisionPage division={division} />;
}

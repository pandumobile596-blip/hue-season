import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ResultView } from "@/components/result/ResultView";

export const metadata: Metadata = {
  title: "Your color season",
  description: "Your personal color season, palette and live virtual draping.",
  // Personal, device-only page: keep it out of search results.
  robots: { index: false, follow: true },
  alternates: { canonical: "/result" },
};

export default function ResultPage() {
  return (
    <Container className="max-w-xl py-8 sm:py-12">
      <ResultView />
    </Container>
  );
}
